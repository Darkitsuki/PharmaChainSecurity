// Every API request is intercepted. These tests cannot write to Oracle.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const output = path.join(require('os').tmpdir(), 'pharma-invoice-evidence');
fs.mkdirSync(output, { recursive: true });
const user = {userId:'test-user',username:'fixture',fullName:'Thu ngân kiểm thử',role:'OWNER',branchId:'test-branch',branchName:'Chi nhánh kiểm thử'};
const base = {invoiceId:'invoice-fixture-uuid',invoiceNumber:'HD-TEST-001',createdDate:'2026-11-06T09:20:00',totalAmount:123450,branchId:user.branchId,cashierId:user.userId,cashierName:user.fullName,status:'COMPLETED',paymentMethod:'CASH',paymentStatus:'PAID',signatureStatus:'VALID'};
const signature = {hashValueSha256:'a'.repeat(64),signatureData:'fixture-only',certificateSerial:'TEST-CERT',signedAt:base.createdDate,status:'VALID'};
const items = [{drugId:'drug-uuid',drugCode:'THUOC01',drugName:'Thuốc kiểm thử có tên dài để kiểm tra bố cục trên điện thoại',batchId:'batch-uuid',batchNo:'LO-2026-01',quantity:3,unitPrice:41150,subTotal:123450}];
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({hasTouch:true});
  await context.addInitScript(user => {if(!['http:','https:'].includes(location.protocol))return;localStorage.setItem('auth_user',JSON.stringify(user));localStorage.setItem('auth_token','isolated-fixture');}, user);
  let stored={...base}, mode='valid', verifyCount=0, large=false, listError=false, historyMode='partial', manyItems=false;
  const errors=[], requests=[], checks=[];
  await context.route('**/api/v1/**', async route => {
    const req=route.request(), url=new URL(req.url()), p=url.pathname.replace('/api/v1','');
    requests.push({p,method:req.method()});
    const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
    if(p==='/auth/me') return send(user);
    if(p==='/notifications/summary') return send({totalUnread:0,ordersCount:0,procurementCount:0,inventoryAlertsCount:0,items:[]});
    if(p.endsWith('/verify-signature')) {
      verifyCount++; await new Promise(resolve=>setTimeout(resolve,180));
      if(mode==='unavailable') return send({title:'Không thể kiểm tra',detail:'Khóa xác minh chưa sẵn sàng.'},503);
      if(mode==='valid') stored={...stored,lastVerifiedAt:'2026-11-06T10:25:30',verifiedByName:user.fullName};
      return send({invoiceId:base.invoiceId,invoiceNumber:base.invoiceNumber,isValid:mode==='valid',verificationStatus:mode==='valid'?'VALID':'INVALID',calculatedHashSha256:'b'.repeat(64),storedHashSha256:signature.hashValueSha256,certificateSerial:signature.certificateSerial,signedAt:base.createdDate,message:mode==='valid'?'Verified':'Signature does not match',lastVerifiedAt:mode==='valid'?stored.lastVerifiedAt:null,verifiedByName:mode==='valid'?user.fullName:null});
    }
    if(p==='/invoices') {
      if(listError) return send({title:'Không tải được hóa đơn',detail:'Không thể tải hóa đơn kiểm thử.'},500);
      const rows=large?Array.from({length:125},(_,i)=>({...base,invoiceId:`large-${i}`,invoiceNumber:`HD-${String(i).padStart(3,'0')}`,totalAmount:i+1})):[stored];
      const page=Number(url.searchParams.get('page')||1),size=Number(url.searchParams.get('pageSize')||20);
      return send({items:rows.slice((page-1)*size,page*size),page,pageSize:size,totalCount:rows.length,totalPages:Math.ceil(rows.length/size)});
    }
    if(p==='/returns' || p.startsWith('/returns/')) {
      const ret={id:'ret-fixture',returnNo:'TH-TEST-001',invoiceId:base.invoiceId,invoiceNo:base.invoiceNumber,branchId:base.branchId,cashierId:user.userId,cashierName:user.fullName,totalRefundAmount:35000,reason:'Isolated fixture',status:'COMPLETED',createdDate:base.createdDate,items:[]};
      const history=[ret,{...ret,id:'ret-rejected',returnNo:'TH-REJECTED',status:'REJECTED',totalRefundAmount:999999}];
      if(historyMode==='full')history.push({...ret,id:'ret-rest',returnNo:'TH-TEST-002',totalRefundAmount:88450});
      if(p==='/returns')return send([...history,{...ret,id:'unrelated-return',invoiceId:'other-invoice',returnNo:'TH-OTHER'}]);
      return send(history.find(item=>p.endsWith('/'+item.id)) || ret);
    }
    if(p===`/invoices/${base.invoiceId}`) return send({...stored,items:manyItems?Array.from({length:18},(_,index)=>({...items[0],drugCode:`THUOC-${index+1}`,unitPrice:10000000,subTotal:30000000})):items,totalAmount:manyItems?540000000:stored.totalAmount,signature:stored.signatureStatus==='MISSING'?null:{...signature,status:stored.signatureStatus}});
    if(req.method()!=='GET') errors.push(`Unexpected mutation ${req.method()} ${p}`);
    return send({title:'Not provided by isolated fixture'},404);
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  const open=async()=>{await page.locator('.ui-data-table tbody tr').first().click();await page.getByRole('heading',{name:'Chữ ký số',exact:true}).waitFor();};
  for(const [width,height] of [[1600,900],[1366,768],[1024,768],[390,844]]) {
    await page.setViewportSize({width,height}); await page.goto('http://127.0.0.1:3000/invoices');
    await page.locator('.ui-data-table tbody tr').first().waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
    await page.screenshot({path:path.join(output,`list-${width}.png`)});
    if(width===1366) {
      const row=page.locator('.ui-data-table tbody tr').first();
      await row.focus(); await page.keyboard.press('Enter'); await page.getByRole('heading',{name:'Chữ ký số',exact:true}).waitFor(); await page.keyboard.press('Escape');
      await row.focus(); await page.keyboard.press('Space'); await page.getByRole('heading',{name:'Chữ ký số',exact:true}).waitFor(); await page.keyboard.press('Escape');
      const before=requests.filter(item=>item.p===`/invoices/${base.invoiceId}`).length;
      await row.evaluate(row=>{row.click();row.click();}); await page.getByRole('heading',{name:'Chữ ký số',exact:true}).waitFor();
      assert.equal(requests.filter(item=>item.p===`/invoices/${base.invoiceId}`).length,before+1); await page.keyboard.press('Escape');
    }
    if(width===390) {await page.locator('.ui-data-table tbody tr').first().tap();await page.getByRole('heading',{name:'Chữ ký số',exact:true}).waitFor();} else await open();
    assert.equal(await page.getByRole('dialog').count(),1);
    assert.ok((await page.getByRole('dialog').innerText()).includes('LO-2026-01'));
    assert.equal(await page.getByText('batch-uuid',{exact:true}).count(),0);
    assert.equal(await page.getByRole('dialog').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
    await page.screenshot({path:path.join(output,`detail-${width}.png`)});
    await page.getByRole('button',{name:'In hóa đơn',exact:true}).last().click(); await page.locator('#printable-receipt').waitFor();
    assert.equal(await page.getByRole('dialog').count(),1);
    await page.getByLabel('Khổ giấy in').selectOption('A4');
    await page.screenshot({path:path.join(output,`a4-${width}.png`)});
    if(width===1366) {
      await page.emulateMedia({media:'print'});
      assert.ok((await page.locator('#printable-receipt').boundingBox()).width>500, 'A4 uses full page layout rather than thermal width');
      const pdf=await page.pdf({path:path.join(output,'receipt-a4.pdf'),preferCSSPageSize:true,printBackground:true});
      const box=pdf.toString('latin1').match(/\/MediaBox\s*\[([^\]]+)\]/)[1].trim().split(/\s+/).map(Number);
      assert.ok(Math.abs(box[2]-595)<2 && Math.abs(box[3]-842)<2, 'PDF must use actual A4, not Letter or a shrunken K80 layout');
      await page.emulateMedia({media:'screen'});
    }
    await page.getByLabel('Khổ giấy in').selectOption('K80');
    await page.waitForTimeout(100);
    const receipt=await page.locator('#printable-receipt').innerText();
    assert.ok(receipt.includes(user.fullName)); assert.ok(receipt.includes('LO-2026-01'));
    assert.ok(!receipt.includes('uuid')); assert.ok(!receipt.includes('19006868')); assert.ok(!receipt.includes('a'.repeat(64)));
    assert.equal(await page.locator('#printable-receipt img').count(),0);
    await page.screenshot({path:path.join(output,`receipt-${width}.png`)});
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('#root').isVisible(),false);
    assert.equal(await page.locator('#printable-receipt').isVisible(),true);
    assert.ok((await page.locator('#printable-receipt').boundingBox()).width<=303);
    if(width===1366) await page.pdf({path:path.join(output,'receipt-k80.pdf'),preferCSSPageSize:true,printBackground:true});
    await page.emulateMedia({media:'screen'});
    await page.getByRole('button',{name:'Quay lại',exact:true}).click();
    await page.getByRole('heading',{name:'Chi tiết hóa đơn',exact:true}).waitFor(); assert.equal(await page.getByRole('dialog').count(),1);
    await page.getByText('Thao tác quản lý',{exact:true}).click();
    await page.getByRole('button',{name:'Hủy hóa đơn & hoàn kho',exact:true}).click();
    assert.equal(await page.getByRole('dialog').count(),1);
    assert.equal(await page.getByRole('button',{name:'Xác nhận hủy & hoàn tồn',exact:true}).isDisabled(),true);
    await page.keyboard.press('Escape');
    await page.getByRole('heading',{name:'Chi tiết hóa đơn',exact:true}).waitFor();
    await page.keyboard.press('Tab'); assert.equal(await page.getByRole('dialog').evaluate(el=>el.contains(document.activeElement)),true);
    await page.keyboard.press('Escape'); assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
    checks.push(`${width}x${height}: list/detail/print/return/focus/Escape/print CSS`);
  }
  await page.setViewportSize({width:1366,height:768}); await open();
  await page.getByRole('button',{name:'Kiểm tra chữ ký',exact:true}).evaluate(button=>{button.click();button.click();});
  await page.getByText('Lần kiểm tra vừa thực hiện: hợp lệ.',{exact:true}).waitFor(); assert.equal(verifyCount,1);
  await page.screenshot({path:path.join(output,'verification-valid.png')});
  await page.keyboard.press('Escape'); await page.reload(); await page.getByText('Đã kiểm tra hợp lệ (lịch sử)',{exact:true}).waitFor();
  await page.goto('about:blank'); await page.goto('http://127.0.0.1:3000/invoices');
  await page.getByText('Đã kiểm tra hợp lệ (lịch sử)',{exact:true}).waitFor(); await open();
  assert.ok((await page.getByRole('dialog').innerText()).includes('10:25'));
  await page.screenshot({path:path.join(output,'verification-history-reloaded.png')});
  assert.ok((await page.getByRole('region',{name:'Lịch sử đổi trả'}).innerText()).includes('35.000'));
  assert.equal(await page.getByText('TH-OTHER',{exact:true}).count(),0);
  mode='invalid'; await page.getByRole('button',{name:'Kiểm tra lại',exact:true}).click(); await page.getByText('Chữ ký không hợp lệ',{exact:true}).last().waitFor();
  await page.screenshot({path:path.join(output,'verification-invalid.png')});
  mode='unavailable'; await page.getByRole('button',{name:'Kiểm tra lại',exact:true}).click(); await page.getByText('Không thể kiểm tra',{exact:true}).last().waitFor();
  await page.screenshot({path:path.join(output,'verification-unavailable.png')});
  assert.equal(await page.getByText('Lần kiểm tra vừa thực hiện: hợp lệ.',{exact:true}).count(),0);
  checks.push('persisted history/refetch/reload; double click sends once; invalid/unavailable supersedes success');
  await page.keyboard.press('Escape');
  for(const state of ['REVOKED','MISSING']) {
    stored={...base,signatureStatus:state,status:state==='REVOKED'?'CANCELLED':'COMPLETED'};
    await page.reload(); await open(); assert.equal(await page.getByRole('button',{name:'Kiểm tra chữ ký',exact:true}).count(),0);
    await page.screenshot({path:path.join(output,`signature-${state.toLowerCase()}.png`)}); await page.keyboard.press('Escape');
  }
  stored={...base}; historyMode='full'; await page.reload(); await open();
  assert.ok((await page.getByRole('region',{name:'Lịch sử đổi trả'}).innerText()).includes('123.450'));
  assert.ok((await page.getByRole('dialog').innerText()).includes('Đã thanh toán'));
  await page.getByRole('link',{name:'Xem phiếu TH-TEST-001',exact:true}).click();
  await page.getByRole('dialog').waitFor(); assert.ok(page.url().includes('/returns?returnId=ret-fixture'));
  assert.ok((await page.getByRole('dialog').innerText()).includes('TH-TEST-001'));
  await page.goto('http://127.0.0.1:3000/invoices');
  manyItems=true; await open(); await page.getByRole('button',{name:'In hóa đơn',exact:true}).click();
  await page.getByLabel('Khổ giấy in').selectOption('A4'); await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.receipt-item').count(),18);
  await page.pdf({path:path.join(output,'receipt-a4-many-items.pdf'),preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'}); await page.getByLabel('Khổ giấy in').selectOption('K80'); await page.waitForTimeout(100);
  assert.equal(await page.locator('#printable-receipt').evaluate(el=>el.scrollWidth>el.clientWidth+2),false);
  await page.emulateMedia({media:'print'}); await page.pdf({path:path.join(output,'receipt-k80-many-items.pdf'),preferCSSPageSize:true,printBackground:true});
  await page.emulateMedia({media:'screen'}); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  manyItems=false; large=true; await page.reload(); await page.getByRole('button',{name:'Trang tiếp theo',exact:true}).waitFor(); await page.getByRole('button',{name:'Trang tiếp theo',exact:true}).click();
  await page.getByPlaceholder('Tìm theo số hóa đơn…').fill('HD-124'); await page.getByText('HD-124',{exact:true}).waitFor(); assert.equal(await page.locator('.ui-data-table tbody tr').count(),1);
  await page.getByPlaceholder('Tìm theo số hóa đơn…').fill(''); await page.getByLabel('Sắp xếp hóa đơn').selectOption('AMOUNT_DESC'); assert.ok((await page.locator('.ui-data-table tbody tr').first().innerText()).includes('HD-124'));
  await page.getByLabel('Trạng thái hóa đơn').selectOption('CANCELLED');
  await page.getByText('Chưa có hóa đơn nào được lưu trữ tại chi nhánh này.',{exact:true}).waitFor();
  await page.getByLabel('Trạng thái hóa đơn').selectOption('ALL');
  await page.getByLabel('Từ ngày',{exact:true}).fill('2026-11-07');
  await page.getByText('Chưa có hóa đơn nào được lưu trữ tại chi nhánh này.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Xóa ngày',exact:true}).click();
  await page.getByLabel('Sắp xếp hóa đơn').selectOption('OLDEST');
  await page.getByLabel('Đến ngày',{exact:true}).fill('2026-11-05');
  await page.getByText('Chưa có hóa đơn nào được lưu trữ tại chi nhánh này.',{exact:true}).waitFor();
  await page.getByLabel('Từ ngày',{exact:true}).fill('2026-11-07');
  assert.equal(await page.getByLabel('Đến ngày',{exact:true}).inputValue(),'2026-11-07');
  await page.getByRole('button',{name:'Xóa ngày',exact:true}).click();
  listError=true; await page.getByRole('button',{name:'Tải lại danh sách',exact:true}).click();
  await page.getByText('Không thể tải hóa đơn kiểm thử.',{exact:true}).waitFor();
  await page.screenshot({path:path.join(output,'invoice-list-api-error.png')});
  checks.push('revoked/missing; partial/full recorded returns and rejected exclusion; linked return detail; 125-record pagination/search/sort/status/date filters; list error');
  assert.equal(await page.getByRole('option',{name:'Chờ thanh toán',exact:true}).count(),0);
  assert.equal(await page.getByRole('option',{name:'Thanh toán thất bại',exact:true}).count(),0);
  assert.deepEqual(errors,[]); assert.equal(requests.filter(r=>r.method!=='GET'&&!r.p.endsWith('/verify-signature')).length,0);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,errors,verifyCount,requests},null,2));
  console.log(JSON.stringify({result:'PASS',checks,verifyCount,evidence:output})); await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
