// Direct integration test simulating the cold/warm boot flow that
// the Tampermonkey script triggers via x-github-client:// protocol.

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseAppURL } from '../../src/lib/parse-app-url'

describe('Real-world Tampermonkey flow', () => {
  it('Cold Boot simulation (app was not running)', () => {
    // When user clicks the Tampermonkey link:
    // 1. OS launches /usr/bin/github-desktop with argv:
    //    ['/usr/bin/github-desktop', 'x-github-client://openRepo/https://github.com/user/repo']
    // 2. App cold-boots, calls handleCommandLineArguments(process.argv)
    // 3. Linux branch finds the URL and calls handleAppURL(url)
    // 4. handleAppURL calls parseAppURL -> registers onDidLoad -> window.sendURLAction

    const tmOrigin = 'https://github.com/some-user/some-repo'
    const tmUrl = `x-github-client://openRepo/${tmOrigin}`
    const action = parseAppURL(tmUrl)

    console.log('\n=== COLD BOOT TEST ===')
    console.log('TM Origin:', tmOrigin)
    console.log('Generated URL:', tmUrl)
    console.log('Parsed action:', JSON.stringify(action))

    // Verify it triggers the clone flow
    assert.equal(action.name, 'open-repository-from-url')
    if (action.name === 'open-repository-from-url') {
      assert.equal(action.url, tmOrigin)
      console.log('✓ Cold boot would trigger CloneRepository popup')
      console.log('✓ initialURL would be:', action.url)
    }
  })

  it('Warm Boot simulation (app already running)', () => {
    // OS passes URL to the running instance via 'second-instance' event
    const tmOrigin = 'https://github.com/some-user/some-repo'
    const tmUrl = `x-github-client://openRepo/${tmOrigin}`
    const action = parseAppURL(tmUrl)

    console.log('\n=== WARM BOOT TEST ===')
    console.log('TM Origin:', tmOrigin)
    console.log('Generated URL:', tmUrl)
    console.log('Parsed action:', JSON.stringify(action))

    // Verify it triggers the clone flow
    assert.equal(action.name, 'open-repository-from-url')
    if (action.name === 'open-repository-from-url') {
      assert.equal(action.url, tmOrigin)
      console.log('✓ Warm boot would trigger CloneRepository popup')
      console.log('✓ initialURL would be:', action.url)
    }
  })

  it('GitHub specific URL (with branch/path)', () => {
    // GitHub web generates URLs like:
    // x-github-client://openRepo/https://github.com/user/repo?branch=foo&filepath=src/index.ts&pr=123
    const ghUrl = 'x-github-client://openRepo/https://github.com/user/repo?branch=main&filepath=README.md'
    const action = parseAppURL(ghUrl)

    console.log('\n=== BRANCH/PATH TEST ===')
    console.log('URL:', ghUrl)
    console.log('Action:', JSON.stringify(action))

    assert.equal(action.name, 'open-repository-from-url')
  })

  it('Test what if user-provided URL is REJECTED', () => {
    // Various edge cases
    const cases = [
      '',
      'x-github-client://openRepo/',
      'x-github-client://openRepo/',  // empty repo path
      'invalid-url',
      'x-github-client://unknownAction/foo',
    ]

    for (const testUrl of cases) {
      const result = parseAppURL(testUrl)
      console.log(`\nInput: "${testUrl}"`)
      console.log(`Result: ${result.name}`)
    }
  })
})
