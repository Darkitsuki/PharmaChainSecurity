"""Invoked only by LocalBrowserFact. OTP travels over parent/child stdin, never an API backdoor."""
from pathlib import Path
import json,os,secrets,sys

if os.environ.get('PHARMA_LOCAL_INTEGRATION')!='1' or os.environ.get('PHARMA_BROWSER_TESTS')!='1':
    raise SystemExit('This browser fixture requires the automated Local test host.')
if os.environ.get('PHARMA_PLAYWRIGHT_PATH'):
    sys.path.insert(0,os.environ['PHARMA_PLAYWRIGHT_PATH'])
from playwright.sync_api import sync_playwright,expect

username=os.environ['PHARMA_UI_USER'];password=os.environ['PHARMA_UI_PASSWORD']
evidence=Path(os.environ['PHARMA_TEST_EVIDENCE']);evidence.mkdir(parents=True,exist_ok=True)
results=[]
def check(name,ok=True):
    results.append({'test':name,'pass':bool(ok)})
    (evidence/'browser-results.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)
    assert ok,name
def overflow(page,name):
    check(name,page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
with sync_playwright() as p:
    browser=p.chromium.launch(channel='msedge',headless=True)
    page=browser.new_page(viewport={'width':1366,'height':1000})
    errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto('http://127.0.0.1:3002/login');page.locator('#username').fill(username);page.locator('#password').fill(password)
    page.locator('form button[type=submit]').click();page.wait_for_url('**/reports')
    old_jwt=page.evaluate("localStorage.getItem('auth_token')")
    page.get_by_role('button',name='Menu tài khoản',exact=True).click();page.get_by_role('link',name='Hồ sơ & Cài đặt',exact=True).click()
    form=page.get_by_role('form',name='Cập nhật hồ sơ');expect(form).to_be_visible()
    form.get_by_label('Họ và tên',exact=True).fill('Browser Updated Profile');form.get_by_label('Số điện thoại',exact=True).fill('0901234567')
    with page.expect_response(lambda r:r.request.method=='PUT' and r.url.endswith('/account/profile')) as response:
        form.get_by_role('button',name='Lưu hồ sơ',exact=True).click()
    check('profile saved to real Oracle via UI',response.value.status==200)
    expect(page.get_by_text('Browser Updated Profile',exact=True).first).to_be_visible()
    check('header/sidebar refreshed without login')
    page.reload();expect(page.get_by_label('Họ và tên',exact=True)).to_have_value('Browser Updated Profile')
    for width in [1920,1366,768,390]:
        page.set_viewport_size({'width':width,'height':1000});overflow(page,'settings viewport '+str(width))
        page.screenshot(path=str(evidence/f'settings-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1366,'height':1000});page.goto('http://127.0.0.1:3002/security/audit-logs')
    expect(page.get_by_role('form',name='Xác minh mật khẩu')).to_be_visible()
    expect(page.get_by_label('Mã OTP',exact=True)).to_be_disabled()
    check('audit page locked before password and OTP')
    page.get_by_label('Mật khẩu xác minh',exact=True).fill(password)
    with page.expect_response(lambda r:r.url.endswith('/audit-access/challenges')) as response:
        page.get_by_role('button',name='Xác minh mật khẩu',exact=True).click()
    check('real password verification issues test-host challenge',response.value.status==200)
    print('OTP',flush=True);code=sys.stdin.readline().strip()
    assert len(code)==6
    page.get_by_label('Mã OTP',exact=True).fill(code)
    with page.expect_response(lambda r:'/audit-logs?' in r.url and r.request.method=='GET') as logs:
        with page.expect_response(lambda r:r.url.endswith('/audit-access/verify')) as response:
            page.get_by_role('button',name='Mở nhật ký',exact=True).click()
    grant=response.value.json()['accessToken'];payload=logs.value.json()
    check('OTP opens audit only in test DI host',response.value.status==200 and logs.value.status==200)
    check('audit UI reads real paginated rows',len(payload['items'])>0 and all(row['branchId'] for row in payload['items']))
    expect(page.locator('main tbody tr')).to_have_count(len(payload['items']))
    page.get_by_label('Lọc tài khoản',exact=True).fill(username);page.wait_for_timeout(600);page.wait_for_load_state('networkidle')
    direct=page.request.get('http://127.0.0.1:3002/api/v1/security/audit-logs?username='+username,headers={'Authorization':'Bearer '+old_jwt,'X-Audit-Access':grant})
    own=direct.json();check('username filter uses actual API data',direct.status==200 and own['totalCount']>20)
    expect(page.locator('main tbody tr')).to_have_count(20)
    page.get_by_role('button',name='Trang tiếp theo',exact=True).click();page.wait_for_timeout(600);page.wait_for_load_state('networkidle')
    check('audit server pagination works',page.locator('main tbody tr').count()==own['totalCount']-20)
    page.get_by_role('button',name='Trang trước',exact=True).click();page.wait_for_timeout(600)
    page.get_by_role('button',name='Xem sự kiện '+own['items'][0]['id'],exact=True).click()
    expect(page.get_by_role('heading',name='Chi tiết sự kiện',exact=True)).to_be_visible();page.get_by_role('button',name='Đóng hộp thoại',exact=True).click()
    check('audit detail displays persisted event')
    for width in [1920,1366,768,390]:
        page.set_viewport_size({'width':width,'height':1000});overflow(page,'audit viewport '+str(width))
        page.screenshot(path=str(evidence/f'audit-{width}.png'),full_page=True)
    page.set_viewport_size({'width':1366,'height':1000})
    page.get_by_label('Loại sự kiện',exact=True).select_option('PROFILE_UPDATED');page.wait_for_timeout(600);page.wait_for_load_state('networkidle')
    expect(page.locator('main tbody tr')).to_have_count(1);expect(page.locator('main tbody tr')).to_contain_text('Cập nhật hồ sơ cá nhân')
    check('event filter matches real profile-change audit')
    page.get_by_label('Loại sự kiện',exact=True).select_option('');page.get_by_label('Lọc tài khoản',exact=True).fill('NO_MATCH_'+secrets.token_hex(4));page.wait_for_timeout(600)
    expect(page.get_by_text('Không có sự kiện phù hợp trong khoảng thời gian đã chọn.',exact=True)).to_be_visible();check('audit empty state')
    page.get_by_role('button',name='Khóa nhật ký',exact=True).click();expect(page.get_by_role('form',name='Xác minh mật khẩu')).to_be_visible()
    denied=page.request.get('http://127.0.0.1:3002/api/v1/security/audit-logs',headers={'Authorization':'Bearer '+old_jwt,'X-Audit-Access':grant})
    check('manual lock invalidates server grant',denied.status==403)
    page.goto('http://127.0.0.1:3002/settings');form=page.get_by_role('form',name='Đổi mật khẩu')
    new_password='Changed-'+secrets.token_hex(12)
    form.get_by_label('Mật khẩu hiện tại',exact=True).fill('wrong-password');form.get_by_label('Mật khẩu mới',exact=True).fill(new_password);form.get_by_label('Xác nhận mật khẩu mới',exact=True).fill(new_password)
    form.get_by_role('button',name='Đổi mật khẩu',exact=True).click();expect(page.get_by_role('alert')).to_contain_text('Mật khẩu hiện tại không đúng.')
    check('wrong current password rejected in UI')
    form.get_by_label('Mật khẩu hiện tại',exact=True).fill(password)
    with page.expect_response(lambda r:r.url.endswith('/account/password') and r.request.method=='POST') as response:
        form.get_by_role('button',name='Đổi mật khẩu',exact=True).click()
    check('password changed through real Oracle API',response.value.status==204)
    page.wait_for_url('**/login');expect(page.get_by_role('alert')).to_contain_text('Đổi mật khẩu thành công')
    invalid=page.request.get('http://127.0.0.1:3002/api/v1/account/profile',headers={'Authorization':'Bearer '+old_jwt})
    check('old JWT rejected after password change',invalid.status==401)
    page.locator('#username').fill(username);page.locator('#password').fill(new_password);page.locator('form button[type=submit]').click();page.wait_for_url('**/reports')
    check('new password login succeeds')
    page.goto('http://127.0.0.1:3002/purchase-orders');expect(page.get_by_role('heading',name='Duyệt đơn mua thuốc',exact=True)).to_be_visible();check('Purchase Orders page regression')
    page.goto('http://127.0.0.1:3002/security/audit-logs');expect(page.get_by_role('form',name='Xác minh mật khẩu')).to_be_visible();check('new session requires new step-up')
    check('no uncaught browser errors',not errors);browser.close()
print('BROWSER_SECURITY_PASS='+str(len(results)),flush=True)
