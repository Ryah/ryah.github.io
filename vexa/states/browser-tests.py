"""Optional UI checks: pip install playwright; playwright install chromium.
Run after build.py. Synthetic fixture only; no private conversations needed.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.on('dialog', lambda dialog: dialog.accept())
    page.goto(Path(__file__).with_name('index.html').resolve().as_uri())
    expect(page.locator('#repair')).to_be_enabled()
    page.locator('#demo').click()
    expect(page.locator('#issues .issue-card')).to_have_count(2)
    page.get_by_role('button', name='Fix Weather', exact=True).click()
    expect(page.locator('[data-field=weather] textarea')).to_be_focused()
    page.locator('[data-field=weather]').get_by_role('button', name='Restore empty field').click()
    assert '<weather></weather>' in page.locator('#output').input_value()
    expect(page.locator('#issues .issue-card')).to_have_count(1)
    page.get_by_role('button', name='Fix What they’re doing', exact=True).click()
    expect(page.locator('[data-field=agenda] textarea')).to_be_focused()
    page.locator('[data-field=agenda] textarea').fill('Reviewing the estate accounts')
    page.locator('[data-field=agenda]').get_by_role('button', name='Save this field').click()
    expect(page.locator('#health')).to_have_text('Ready to copy back')
    assert '<agenda>Reviewing the estate accounts</agenda>' in page.locator('#output').input_value()
    # Present-but-empty fields should remain valid; absence of optional sections is fine.
    response = page.locator('#output').input_value()
    page.locator('#advanced > summary').click()
    page.locator('#output').fill(response.replace('<agenda>Reviewing the estate accounts</agenda>', '<agenda></agenda>'))
    page.locator('#reparse').click()
    expect(page.locator('#issues .issue-card')).to_have_count(0)
    # Each person is checked independently, and the issue must identify the affected card.
    response = page.locator('#output').input_value()
    entry = response[response.index('<ent_off>'):response.index('</ent_off>')+len('</ent_off>')]
    broken_entry = entry.replace('Charlotte Claymore', 'Example Second Character').replace('<agenda></agenda>', '')
    page.locator('#output').fill(response.replace(entry, entry + broken_entry))
    page.locator('#reparse').click()
    expect(page.locator('#issues .issue-card')).to_have_count(1)
    assert 'Example Second Character' in page.locator('#issues').inner_text()
    page.get_by_role('button', name='Fix What they’re doing', exact=True).click()
    page.locator('.missing-field').get_by_role('button', name='Restore empty field').click()
    expect(page.locator('#health')).to_have_text('Ready to copy back')
    for width in [320, 390, 768, 1280]:
        page.set_viewport_size({'width':width, 'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), width
    with page.expect_download() as pending:
        page.locator('#export').click()
    exported = Path(pending.value.path()).read_text(encoding='utf-8')
    assert exported.startswith('The library settles into a quiet evening.')
    assert '<weather></weather>' in exported
    assert 'Example Second Character' in exported
    assert not errors, errors
    browser.close()
print('PASS: guided fixes, named affected records, empty/optional tolerance, focus, 4 widths, offline export.')
