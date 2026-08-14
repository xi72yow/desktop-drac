import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseAppURL } from '../../src/lib/parse-app-url'

describe('Tampermonkey script URL debugging', () => {
  it('parses Tampermonkey-generated URL format', () => {
    const testUrl = 'x-github-client://openRepo/https://github.com/octocat/Hello-World'
    const result = parseAppURL(testUrl)

    console.log('\n=== Test Case ===')
    console.log('Input URL:', testUrl)
    console.log('Parsed result:', JSON.stringify(result, null, 2))

    if (result.name === 'open-repository-from-url') {
      console.log('\n=== Result Analysis ===')
      console.log('Action name:', result.name)
      console.log('Repository URL:', result.url)
      console.log('Branch:', result.branch)
      console.log('PR:', result.pr)
      console.log('Filepath:', result.filepath)
      console.log('\n✓ URL will be passed to CloneRepository popup as initialURL')
      console.log('✓ User can clone by clicking "Clone" button')
    } else {
      console.log('\n✗ URL was rejected - app will only OPEN (no clone)')
    }

    assert.equal(result.name, 'open-repository-from-url')
  })

  it('tests what GitHub web actually generates', () => {
    // https://github.com/<user>/<repo> uses this exact format:
    const githubUrl = 'x-github-client://openRepo/https://github.com/octocat/Hello-World'
    const result = parseAppURL(githubUrl)

    console.log('\n=== GitHub Web Format ===')
    console.log('Format: x-github-client://openRepo/<full-repo-url>')
    console.log('Result:', JSON.stringify(result))
  })
})
