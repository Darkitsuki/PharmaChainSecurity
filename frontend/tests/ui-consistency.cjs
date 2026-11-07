const { chromium } = require(process.env.PHARMA_UI_PLAYWRIGHT || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const output = process.env.PHARMA_UI_EVIDENCE || path.join(require('os').tmpdir(), 'pharmasecure-ui-browser', 'evidence');
fs.mkdirSync(output, {recursive:true});
const now = '2026-11-06T08:35:00';
const user = {userId:'u-test',username:'ui-fixture',fullName:'Dược sĩ kiểm thử giao diện',role:'OWNER',branchId:'br-test',branchName:'Nhà thuốc kiểm thử UI'};
const drug = {drugId:'dr-test',drugCode:'THUOC01',name:'Paracetamol 500mg',activeIngredient:'Paracetamol',unit:'Hộp',price:35000,isActive:true};
const batch = {batchId:'batch-test',drugId:drug.drugId,batchNo:'BATCH-2026-01',mfgDate:'2026-01-01',expiryDate:'2027-01-01',stockQuantity:150};
const invoice = {invoiceId:'inv-test',invoiceNumber:'HD20261106-0001',createdDate:now,totalAmount:35000,branchId:'br-test',cashierId:'u-test',status:'COMPLETED',paymentMethod:'CASH',paymentStatus:'PAID'};
const customer = {id:'customer-test',customerCode:'KH001',fullName:'Nguyễn Văn An',phoneNumber:'0901234567',email:'test@example.invalid',address:'Địa chỉ kiểm thử có tên đường dài để đánh giá hiển thị trên thiết bị nhỏ',branchId:'br-test',totalSpent:1250000,points:125,isActive:true};
const supplier = {id:'sup-test',supplierCode:'NCC01',supplierName:'Dược phẩm kiểm thử',contactPerson:'Nguyễn Thị Bình',phoneNumber:'0901234567',email:'test@example.invalid',address:'Địa chỉ kiểm thử',taxCode:'0000000000',isActive:true,createdDate:now};
const order = {id:'po-test',orderNo:'PO20261106-0001',branchId:'br-test',supplierId:supplier.id,supplierName:supplier.supplierName,createdBy:'u-warehouse',creatorName:'Thủ kho kiểm thử',approvedBy:null,approverName:null,totalEstimatedAmount:350000,status:'PENDING',approvedDate:null,expectedDeliveryDate:null,notes:'Dữ liệu cô lập trong trình duyệt',createdDate:now,items:[{drugId:drug.drugId,drugName:drug.name,quantity:10,estimatedUnitPrice:35000,subTotal:350000,receivedQuantity:0,notes:null}],receipts:[]};
const audit={id:'audit-test',auditNo:'KK20261106-01',branchId:'br-test',createdBy:'u-test',creatorName:user.fullName,approverName:null,approvedDate:null,auditDate:now,status:'IN_PROGRESS',totalItemsCount:1,matchedCount:0,discrepancyCount:0,totalDiscrepancyValue:0,notes:null,createdDate:now};
const transfer={id:'transfer-test',transferNo:'DC20261106-01',fromBranchId:'br-test',fromBranchName:user.branchName,toBranchId:'br-other',toBranchName:'Chi nhánh nhận kiểm thử',createdById:'u-test',createdByName:user.fullName,status:'PENDING',totalItemsCount:1,totalQuantity:10,createdDate:now,notes:null};
const receipt={id:'receipt-test',receiptNo:'PN20261106-01',branchId:'br-test',supplierId:supplier.id,supplierName:supplier.supplierName,warehouseStaffId:'u-test',warehouseStaffName:user.fullName,totalAmount:350000,note:null,status:'COMPLETED',createdDate:now,items:[]};
const ret={id:'return-test',returnNo:'TH20261106-01',invoiceId:invoice.invoiceId,invoiceNo:invoice.invoiceNumber,branchId:'br-test',cashierId:'u-test',cashierName:user.fullName,customerId:customer.id,customerName:customer.fullName,totalRefundAmount:35000,reason:'Kiểm thử UI cô lập',status:'COMPLETED',createdDate:now,items:[]};
const branches=[{id:'br-test',branchName:user.branchName,address:'Địa chỉ kiểm thử',activeUsersCount:3,totalInvoicesCount:2},{id:'br-other',branchName:'Chi nhánh nhận kiểm thử',address:'Địa chỉ khác',activeUsersCount:1,totalInvoicesCount:0}];
function paged(items,url) { const page=Number(url.searchParams.get('page')||1),size=Number(url.searchParams.get('pageSize')||20); return {items:items.slice((page-1)*size,page*size),page,pageSize:size,totalCount:items.length,totalPages:Math.max(1,Math.ceil(items.length/size))}; }
const routes=['reports','checkout','invoices','returns','customers','inventory','purchase-orders','goods-receipts','inventory-audits','stock-transfers','suppliers','drugs','branches','users','security/audit-logs','settings','login'];
async function checkPublicLogin(browser) {
 const context=await browser.newContext();const page=await context.newPage();const checks=[];
 for(const size of [{width:1600,height:900},{width:1366,height:768},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(size);await page.goto('http://127.0.0.1:3000/login');await page.locator('input').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  await page.screenshot({path:path.join(output,`login-${size.width}.png`)});
  checks.push({route:'login',size:`${size.width}x${size.height}`,result:'PASS',fonts:await page.evaluate(()=>({family:getComputedStyle(document.body).fontFamily,dmSans:document.fonts.check('14px "DM Sans"'),manrope:document.fonts.check('800 24px Manrope', 'Đặng Thị Hồng Nhung 1.250.000 ₫')}))});
 }
 await context.close();return checks;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 if(process.argv.includes('--public')){const checks=await checkPublicLogin(browser);fs.writeFileSync(path.join(output,'public-results.json'),JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));await browser.close();return;}
 const context=await browser.newContext();const requests=[],errors=[],checks=[];let role='OWNER';let failPath='';let largeInvoiceList=false;let signatureValid=true;
 await context.addInitScript(({user})=>{localStorage.setItem('auth_user',JSON.stringify(user));localStorage.setItem('auth_token','isolated-browser-fixture');},{user});
 await context.route('**/api/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api/v1','');requests.push({p,method:req.method()});
  // Every API request is intercepted. No request is forwarded to the real Backend/Oracle.
  const send=(data,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  if(p===failPath)return send({status:500,title:'Lỗi kiểm thử cô lập',detail:'Không thể tải dữ liệu kiểm thử.'},500);
  if(p==='/auth/me')return send({...user,role});
  if(p==='/notifications/summary')return send({totalUnread:0,ordersCount:0,procurementCount:0,inventoryAlertsCount:0,items:[]});
  if(p==='/account/profile')return send({...user,role,isActive:true,phoneNumber:'0901234567',email:'test@example.invalid'});
  if(p==='/security/audit-access/challenges')return send({challengeId:'test-challenge',maskedEmail:'t***@example.invalid',expiresAt:new Date(Date.now()+300000).toISOString()});
  if(p==='/security/audit-access/verify')return send({accessToken:'isolated-audit-fixture',expiresAt:new Date(Date.now()+300000).toISOString()});
  if(p==='/security/audit-logs/statistics')return send({loginSuccess:1,loginFailure:0,accessDenied:0,importantActions:0,totalCount:1});
  if(p.startsWith('/security/audit-logs')){const entry={id:'log-test',userId:'u-test',username:'ui-fixture',branchId:'br-test',eventType:'LOGIN_SUCCESS',ipAddress:'127.0.0.1',userAgent:'UI fixture',failureReason:null,createdDate:now,outcome:'SUCCESS'};return send(p==='/security/audit-logs'?paged([entry],url):entry);}
  if(p.startsWith('/reports/')){const days=Number(url.searchParams.get('days')||7);return send({totalRevenue:days*35000,totalInvoices:days,todayRevenue:35000,todayInvoices:1,monthRevenue:1050000,monthInvoices:30,topSellingDrugs:[{drugId:drug.drugId,drugName:drug.name,drugCode:drug.drugCode,totalQuantitySold:10,totalRevenue:350000}],dailySales:Array.from({length:days},(_,i)=>({date:`2026-10-${String(i+1).padStart(2,'0')}`,revenue:(i+1)*35000,invoiceCount:i+1}))});}
  if(p==='/drugs')return send(paged([drug,{...drug,drugId:'dr-off',drugCode:'THUOC02',name:'Thuốc tạm ngưng',isActive:false}],url));
  if(p.endsWith('/batches'))return send([batch]);
  if(p==='/inventory')return send(paged([{branchId:'br-test',drugId:drug.drugId,drugName:drug.name,batchId:batch.batchId,batchNo:batch.batchNo,mfgDate:batch.mfgDate,expiryDate:batch.expiryDate,quantity:150,availableQuantity:150}],url));
  if(p==='/inventory/available-by-drug')return send([{drugId:drug.drugId,availableQuantity:150}]);
  if(p.startsWith('/inventory/'))return send([{branchId:'br-test',drugId:drug.drugId,drugCode:drug.drugCode,drugName:drug.name,batchId:batch.batchId,batchNo:batch.batchNo,expiryDate:batch.expiryDate,mfgDate:batch.mfgDate,quantity:5}]);
  if(p==='/invoices')return send(paged(largeInvoiceList ? Array.from({length:125},(_,i)=>({...invoice,invoiceId:`invoice-${i}`,invoiceNumber:`HD-${String(i).padStart(3,'0')}`,totalAmount:(i+1)*1000})) : [invoice,{...invoice,invoiceId:'inv-pending',invoiceNumber:'HD20261106-0002',paymentStatus:'PENDING'}],url));
  if(p.endsWith('/verify-signature'))return send({invoiceId:invoice.invoiceId,invoiceNumber:invoice.invoiceNumber,isValid:signatureValid,message:signatureValid?'Chữ ký hợp lệ trong fixture':'Chữ ký không hợp lệ trong fixture',certificateSerial:'FIXTURE-CERT',signedAt:now,lastVerifiedAt:now,verifiedByName:user.fullName});
  if(p.startsWith('/invoices/'))return send({...invoice,customerName:customer.fullName,customerPhone:customer.phoneNumber,items:[{drugId:drug.drugId,drugCode:drug.drugCode,drugName:drug.name,batchId:batch.batchId,quantity:1,unitPrice:35000,subTotal:35000}],signature:{hashValueSha256:'a'.repeat(64),signatureData:'isolated-fixture',certificateSerial:'FIXTURE-CERT',signedAt:now,status:'VALID'}});
  if(p==='/customers')return send([customer]);if(p==='/suppliers')return send([supplier]);if(p==='/branches')return send(branches);
  if(p==='/users')return send([{id:'u-test',username:user.username,fullName:user.fullName,phoneNumber:'0901234567',role:'OWNER',isActive:true,createdDate:now},{id:'u-sales',username:'sales-fixture',fullName:'Nhân viên kiểm thử',role:'SALES',isActive:true,createdDate:now}]);
  if(p==='/purchase-orders')return send(paged([order],url));if(p.startsWith('/purchase-orders/'))return send(order);
  if(p==='/goods-receipts')return send([receipt]);if(p.startsWith('/goods-receipts/'))return send(receipt);
  if(p==='/returns')return send([ret]);if(p.startsWith('/returns/'))return send(ret);
  if(p==='/inventory-audits')return send([audit]);if(p.startsWith('/inventory-audits/'))return send({...audit,items:[{...drug,batchId:batch.batchId,batchNumber:batch.batchNo,expiryDate:batch.expiryDate,systemQuantity:150,actualQuantity:150,difference:0,unitPrice:35000,reason:null}]});
  if(p==='/stock-transfers')return send([transfer]);if(p.startsWith('/stock-transfers/'))return send({...transfer,items:[{...drug,batchId:batch.batchId,batchNumber:batch.batchNo,expiryDate:batch.expiryDate,quantity:10,notes:null}]});
  return send({status:404,title:'Fixture endpoint missing',detail:p},404);
 });
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const size of [{width:1600,height:900},{width:1366,height:768},{width:768,height:1024},{width:390,height:844}]){
  console.log('Checking viewport',size.width);await page.setViewportSize(size);
  for(const name of routes.filter(x=>x!=='login')){
   const prior=errors.length;await page.goto('http://127.0.0.1:3000/'+name);await page.waitForTimeout(450);
   assert.equal(errors.length,prior,`${name}: browser runtime error ${errors.slice(prior)}`);
   assert.equal(await page.locator('h1').count(),1,name+' missing title');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   checks.push({route:name,size:`${size.width}x${size.height}`,render:'PASS',overflow:overflow?'FAIL':'PASS'});
   await page.screenshot({path:path.join(output,`${name.replaceAll('/','-')}-${size.width}.png`),fullPage:true});
  }
 }
 await page.setViewportSize({width:1366,height:768});
 for(const name of ['invoices','customers','returns','inventory','purchase-orders','goods-receipts','inventory-audits','stock-transfers','suppliers','drugs','branches','users']){
  await page.goto('http://127.0.0.1:3000/'+name);await page.waitForTimeout(350);
  const input=page.locator('input[placeholder]').filter({visible:true}).first();
  if(await input.count()){await input.fill('ZZZZ-NO-MATCH');await page.waitForTimeout(400);assert.equal(await page.locator('.ui-data-table tbody tr button').count(),0,name+' search failed');await input.fill('');}
  const refresh=page.getByRole('button',{name:'Tải lại danh sách',exact:true});
  if(await refresh.count()){const before=requests.length;await refresh.click();await page.waitForTimeout(400);assert.ok(requests.length>before,name+' refresh did not request');}
  checks.push({route:name,interaction:'search/refresh',result:'PASS'});
 }
 await page.goto('http://127.0.0.1:3000/invoices');await page.waitForTimeout(350);
 await page.getByLabel('Trạng thái hóa đơn').selectOption('PAID');assert.equal(await page.locator('.ui-data-table tbody tr').count(),1);checks.push({route:'invoices',interaction:'status filter',result:'PASS'});
 await page.getByLabel('Trạng thái hóa đơn').selectOption('ALL');await page.locator('.ui-data-table tbody tr').first().click();await page.getByRole('dialog').waitFor();await page.screenshot({path:path.join(output,'invoice-detail.png')});await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
 await page.locator('.ui-data-table tbody tr').first().click();await page.getByRole('button',{name:'Kiểm tra chữ ký',exact:true}).click();await page.getByText('Lần kiểm tra vừa thực hiện: hợp lệ.',{exact:true}).waitFor();signatureValid=false;await page.getByRole('button',{name:'Kiểm tra lại',exact:true}).click();await page.getByText('Chữ ký không hợp lệ',{exact:true}).last().waitFor();await page.keyboard.press('Escape');assert.ok((await page.locator('.ui-data-table tbody tr').first().innerText()).includes('Chữ ký không hợp lệ'));checks.push({route:'invoices',interaction:'latest failed verification overrides previously valid result',result:'PASS'});signatureValid=true;
 largeInvoiceList=true;await page.getByRole('button',{name:'Tải lại danh sách',exact:true}).click();await page.waitForTimeout(450);await page.getByRole('button',{name:'Trang tiếp theo',exact:true}).click();assert.ok((await page.locator('.ui-data-table').innerText()).includes('HD-020'));await page.getByPlaceholder('Tìm theo số hóa đơn…').fill('HD-124');assert.equal(await page.locator('.ui-data-table tbody tr').count(),1);await page.getByPlaceholder('Tìm theo số hóa đơn…').fill('');await page.getByLabel('Sắp xếp hóa đơn').selectOption('AMOUNT_DESC');assert.ok((await page.locator('.ui-data-table tbody tr').first().innerText()).includes('HD-124'));checks.push({route:'invoices',interaction:'125 records across API pages / pagination / search / numeric sort',result:'PASS'});largeInvoiceList=false;
 for(const name of ['customers','returns','goods-receipts','inventory-audits','stock-transfers','suppliers','drugs','branches','users']){
  await page.goto('http://127.0.0.1:3000/'+name);await page.waitForTimeout(350);
  const create=page.locator('.ui-page-actions button').first();if(await create.count()){await create.click();await page.waitForTimeout(350);assert.ok(await page.getByRole('dialog').count(),name+' create modal missing');await page.screenshot({path:path.join(output,name+'-modal.png')});await page.keyboard.press('Escape');checks.push({route:name,interaction:'open/close create modal',result:'PASS'});}
 }
 // Read-only details, print preview and validation are exercised against isolated responses.
 await page.goto('http://127.0.0.1:3000/inventory');await page.waitForTimeout(350);await page.locator('.ui-data-table tbody tr').first().click();await page.getByRole('dialog').waitFor();assert.ok((await page.getByRole('dialog').innerText()).includes('150'));await page.keyboard.press('Escape');checks.push({route:'inventory',interaction:'read-only lot detail',result:'PASS'});
 await page.goto('http://127.0.0.1:3000/invoices');await page.waitForTimeout(350);await page.locator('.ui-data-table tbody tr').first().click();await page.getByRole('button',{name:'In hóa đơn',exact:true}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:path.join(output,'invoice-print.png')});await page.keyboard.press('Escape');checks.push({route:'invoices',interaction:'K80 print preview open/close',result:'PASS'});
 await page.goto('http://127.0.0.1:3000/inventory-audits');await page.waitForTimeout(350);assert.ok(!(await page.locator('.ui-data-table').innerText()).includes('Khớp 100%'));await page.getByRole('button',{name:'Kiểm đếm',exact:true}).click();await page.getByRole('dialog').waitFor();await page.screenshot({path:path.join(output,'audit-count-detail.png')});await page.keyboard.press('Escape');checks.push({route:'inventory-audits',interaction:'in-progress status and count detail',result:'PASS'});
 await page.goto('http://127.0.0.1:3000/purchase-orders/po-test');await page.waitForTimeout(500);assert.ok((await page.locator('body').innerText()).includes(order.orderNo));await page.screenshot({path:path.join(output,'purchase-order-detail.png'),fullPage:true});checks.push({route:'purchase-orders/:id',interaction:'detail route',result:'PASS'});
 await page.goto('http://127.0.0.1:3000/drugs');await page.waitForTimeout(350);await page.getByRole('button',{name:'Tạm ngưng',exact:true}).first().click();await page.waitForTimeout(100);assert.ok((await page.locator('.ui-data-table').innerText()).includes('Thuốc tạm ngưng'));assert.ok(!(await page.locator('.ui-data-table').innerText()).includes(drug.name));checks.push({route:'drugs',interaction:'inactive filter',result:'PASS'});
 await page.goto('http://127.0.0.1:3000/customers');await page.waitForTimeout(350);await page.locator('.ui-page-actions button').first().click();const priorWrites=requests.filter(x=>x.method!=='GET').length;await page.getByRole('dialog').locator('button[type=submit]').click();await page.waitForTimeout(100);assert.equal(requests.filter(x=>x.method!=='GET').length,priorWrites);checks.push({route:'customers',interaction:'empty form validation blocks request',result:'PASS'});await page.keyboard.press('Escape');
 await page.goto('http://127.0.0.1:3000/reports');await page.waitForTimeout(350);await page.getByRole('button',{name:'30 ngày',exact:true}).click();await page.waitForTimeout(350);assert.equal(await page.locator('[role=img][aria-label*="hóa đơn"]').count(),30);checks.push({route:'reports',interaction:'30-day chart',result:'PASS'});
 await page.getByRole('button',{name:'Thu gọn thanh điều hướng',exact:true}).click();await page.waitForTimeout(250);assert.equal(await page.locator('h1').count(),1);await page.getByRole('button',{name:'Mở rộng thanh điều hướng',exact:true}).click();checks.push({route:'shell',interaction:'sidebar collapse/expand preserves content',result:'PASS'});
 await page.getByRole('button',{name:'Menu tài khoản',exact:true}).click();await page.getByRole('link',{name:'Hồ sơ & Cài đặt',exact:true}).waitFor({state:'visible'});assert.equal(await page.getByRole('link',{name:'Hồ sơ & Cài đặt',exact:true}).count(),1);await page.keyboard.press('Escape');checks.push({route:'shell',interaction:'account dropdown',result:'PASS'});
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Thông báo chi nhánh',exact:true}).click();const notificationBox=await page.getByRole('region',{name:'Trung tâm thông báo'}).boundingBox();assert.ok(notificationBox.x>=0 && notificationBox.x+notificationBox.width<=390);await page.keyboard.press('Escape');await page.getByRole('region',{name:'Trung tâm thông báo'}).waitFor({state:'hidden'});checks.push({route:'shell',interaction:'mobile notification bounds and Escape',result:'PASS'});await page.setViewportSize({width:1366,height:768});
 await page.goto('http://127.0.0.1:3000/security/audit-logs');await page.getByLabel('Mật khẩu xác minh').fill('fixture-only');await page.getByRole('button',{name:'Xác minh mật khẩu',exact:true}).click();await page.getByLabel('Mã OTP').fill('123456');await page.getByRole('button',{name:'Mở nhật ký',exact:true}).click();await page.waitForTimeout(800);assert.equal(await page.locator('.ui-data-table tbody tr').count(),1);await page.screenshot({path:path.join(output,'audit-unlocked.png'),fullPage:true});checks.push({route:'audit',interaction:'isolated OTP gates and list',result:'PASS'});
 for(const r of ['SALES','WAREHOUSE']){role=r;await page.goto('http://127.0.0.1:3000/inventory');await page.waitForTimeout(400);assert.equal(await page.getByRole('link',{name:'Quản lý nhân viên',exact:true}).count(),0);await page.goto('http://127.0.0.1:3000/reports');await page.waitForTimeout(400);assert.ok(!page.url().endsWith('/reports'));checks.push({role:r,interaction:'OWNER route blocked',result:'PASS'});}
 role='OWNER';failPath='/customers';await page.goto('http://127.0.0.1:3000/customers');await page.waitForTimeout(400);assert.ok((await page.locator('body').innerText()).includes('Không thể tải dữ liệu kiểm thử'));checks.push({route:'customers',interaction:'API error',result:'PASS'});
 checks.push(...await checkPublicLogin(browser));
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({checks,errors,requests,mode:'All API requests intercepted; no real backend or Oracle writes'},null,2));
 console.log(JSON.stringify({checks:checks.length,overflows:checks.filter(x=>x.overflow==='FAIL'),errors,output}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
