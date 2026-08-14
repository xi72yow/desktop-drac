import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseAppURL } from '../../src/lib/parse-app-url'

describe('Tampermonkey script URL format', () => {
  it('parses Tampermonkey-generated URL correctly', () => {
    // This is what the Tampermonkey script generates:
    // x-github-client://openRepo/https://github.com/octocat/Hello-World
    const result = parseAppURL(
      'x-github-client://openRepo/https://github.com/octocat/Hello-World'
    )

    console.log('Parsed result:', JSON.stringify(result, null, 2))

    assert.equal(result.name, 'open-repository-from-url')

    const openRepo = result as any
    console.log('Extracted URL:', openRepo.url)
    console.log('Branch:', openRepo.branch)
    console.log('PR:', openRepo.pr)
    console.log('Filepath:', openRepo.filepath)
  })
})
