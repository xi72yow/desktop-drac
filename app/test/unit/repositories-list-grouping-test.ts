import { describe, it } from 'node:test'
import assert from 'node:assert'
import { groupRepositories } from '../../src/ui/repositories-list/group-repositories'
import { Repository, ILocalRepositoryState } from '../../src/models/repository'
import { CloningRepository } from '../../src/models/cloning-repository'
import { gitHubRepoFixture } from '../helpers/github-repo-builder'

describe('repository list grouping', () => {
  const repositories: Array<Repository | CloningRepository> = [
    new Repository('repo1', 1, null, false),
    new Repository(
      'repo2',
      2,
      gitHubRepoFixture({ owner: 'me', name: 'my-repo2' }),
      false
    ),
    new Repository(
      'repo3',
      3,
      gitHubRepoFixture({
        owner: '',
        name: 'my-repo3',
        endpoint: 'https://github.big-corp.com/api/v3',
      }),
      false
    ),
  ]

  const cache = new Map<number, ILocalRepositoryState>()

  it('groups repositories by owners/Enterprise/Other', () => {
    const grouped = groupRepositories(repositories, cache, [], [])
    // Groups: dotcom, enterprise, other (no pinned/updates/recent since no data)
    assert.equal(grouped.length, 3)

    assert.equal(grouped[0].identifier.kind, 'dotcom')
    assert.equal((grouped[0].identifier as any).owner.login, 'me')
    assert.equal(grouped[0].items.length, 1)

    let item = grouped[0].items[0]
    assert.equal(item.repository.path, 'repo2')

    assert.equal(grouped[1].identifier.kind, 'enterprise')
    assert.equal(grouped[1].items.length, 1)

    item = grouped[1].items[0]
    assert.equal(item.repository.path, 'repo3')

    assert.equal(grouped[2].identifier.kind, 'other')
    assert.equal(grouped[2].items.length, 1)

    item = grouped[2].items[0]
    assert.equal(item.repository.path, 'repo1')
  })

  it('sorts repositories alphabetically within each group', () => {
    const repoA = new Repository('a', 1, null, false)
    const repoB = new Repository(
      'b',
      2,
      gitHubRepoFixture({ owner: 'me', name: 'b' }),
      false
    )
    const repoC = new Repository('c', 2, null, false)
    const repoD = new Repository(
      'd',
      2,
      gitHubRepoFixture({ owner: 'me', name: 'd' }),
      false
    )
    const repoZ = new Repository('z', 3, null, false)

    const grouped = groupRepositories(
      [repoC, repoB, repoZ, repoD, repoA],
      cache,
      [],
      []
    )
    assert.equal(grouped.length, 2)

    assert.equal(grouped[0].identifier.kind, 'dotcom')
    assert.equal((grouped[0].identifier as any).owner.login, 'me')
    assert.equal(grouped[0].items.length, 2)

    let items = grouped[0].items
    assert.equal(items[0].repository.path, 'b')
    assert.equal(items[1].repository.path, 'd')

    assert.equal(grouped[1].identifier.kind, 'other')
    assert.equal(grouped[1].items.length, 3)

    items = grouped[1].items
    assert.equal(items[0].repository.path, 'a')
    assert.equal(items[1].repository.path, 'c')
    assert.equal(items[2].repository.path, 'z')
  })

  it('only disambiguates Enterprise repositories', () => {
    const repoA = new Repository(
      'repo',
      1,
      gitHubRepoFixture({ owner: 'user1', name: 'repo' }),
      false
    )
    const repoB = new Repository(
      'repo',
      2,
      gitHubRepoFixture({ owner: 'user2', name: 'repo' }),
      false
    )
    const repoC = new Repository(
      'enterprise-repo',
      3,
      gitHubRepoFixture({
        owner: 'business',
        name: 'enterprise-repo',
        endpoint: 'https://ghe.io/api/v3',
      }),
      false
    )
    const repoD = new Repository(
      'enterprise-repo',
      3,
      gitHubRepoFixture({
        owner: 'silliness',
        name: 'enterprise-repo',
        endpoint: 'https://ghe.io/api/v3',
      }),
      false
    )

    const grouped = groupRepositories(
      [repoA, repoB, repoC, repoD],
      cache,
      [],
      []
    )
    assert.equal(grouped.length, 3)

    assert.equal(grouped[0].identifier.kind, 'dotcom')
    assert.equal((grouped[0].identifier as any).owner.login, 'user1')
    assert.equal(grouped[0].items.length, 1)

    assert.equal(grouped[1].identifier.kind, 'dotcom')
    assert.equal((grouped[1].identifier as any).owner.login, 'user2')
    assert.equal(grouped[1].items.length, 1)

    assert.equal(grouped[2].identifier.kind, 'enterprise')
    assert.equal(grouped[2].items.length, 2)

    assert.equal(grouped[0].items[0].text[0], 'repo')
    assert(!grouped[0].items[0].needsDisambiguation)

    assert.equal(grouped[1].items[0].text[0], 'repo')
    assert(!grouped[1].items[0].needsDisambiguation)

    assert.equal(grouped[2].items[0].text[0], 'enterprise-repo')
    assert(grouped[2].items[0].needsDisambiguation)

    assert.equal(grouped[2].items[1].text[0], 'enterprise-repo')
    assert(grouped[2].items[1].needsDisambiguation)
  })

  it('places pinned repositories in the Pinned group at the top', () => {
    const repo = new Repository(
      'pinned-repo',
      1,
      gitHubRepoFixture({ owner: 'me', name: 'pinned-repo' }),
      false
    )
    const cache = new Map<number, ILocalRepositoryState>()
    const grouped = groupRepositories([repo], cache, [], [1])
    assert.equal(grouped.length, 2)
    assert.equal(grouped[0].identifier.kind, 'pinned')
    assert.equal(grouped[0].items.length, 1)
    assert.equal(grouped[0].items[0].repository.path, 'pinned-repo')
    // Also appears in dotcom group (dual membership like recent)
    assert.equal(grouped[1].identifier.kind, 'dotcom')
    assert.equal(grouped[1].items.length, 1)
  })

  it('places repositories with updates (behind > 0) in the Updates group', () => {
    const repo = new Repository(
      'behind-repo',
      1,
      gitHubRepoFixture({ owner: 'me', name: 'behind-repo' }),
      false
    )
    const cache = new Map<number, ILocalRepositoryState>()
    cache.set(1, { aheadBehind: { ahead: 0, behind: 3 }, changedFilesCount: 0 })
    const grouped = groupRepositories([repo], cache, [], [])
    assert.equal(grouped.length, 2)
    assert.equal(grouped[0].identifier.kind, 'updates')
    assert.equal(grouped[0].items.length, 1)
    assert.equal(grouped[0].items[0].repository.path, 'behind-repo')
    // Also appears in dotcom group (dual membership like recent)
    assert.equal(grouped[1].identifier.kind, 'dotcom')
    assert.equal(grouped[1].items.length, 1)
  })

  it('orders groups as Pinned > Updates > Recent > dotcom > enterprise > other', () => {
    const repoPinned = new Repository(
      'pinned-repo',
      1,
      gitHubRepoFixture({ owner: 'me', name: 'pinned-repo' }),
      false
    )
    const repoBehind = new Repository(
      'behind-repo',
      2,
      gitHubRepoFixture({ owner: 'me', name: 'behind-repo' }),
      false
    )
    const repoRecent = new Repository(
      'recent-repo',
      3,
      gitHubRepoFixture({ owner: 'me', name: 'recent-repo' }),
      false
    )
    const repoOther = new Repository('other-repo', 4, null, false)
    const repoEnterprise = new Repository(
      'enterprise-repo',
      5,
      gitHubRepoFixture({
        owner: 'business',
        name: 'enterprise-repo',
        endpoint: 'https://ghe.io/api/v3',
      }),
      false
    )

    const cache = new Map<number, ILocalRepositoryState>()
    cache.set(2, { aheadBehind: { ahead: 0, behind: 2 }, changedFilesCount: 0 })

    // Need 8+ repos total for the recent group to appear (threshold is 7)
    const dummy1 = new Repository('dummy1', 10, null, false)
    const dummy2 = new Repository('dummy2', 11, null, false)
    const dummy3 = new Repository('dummy3', 12, null, false)

    const grouped = groupRepositories(
      [
        repoOther,
        repoPinned,
        repoEnterprise,
        repoRecent,
        repoBehind,
        dummy1,
        dummy2,
        dummy3,
      ],
      cache,
      [3], // recent repo id
      [1] // pinned repo id
    )

    const groupKinds = grouped.map(g => g.identifier.kind)
    assert.deepEqual(groupKinds, [
      'pinned',
      'updates',
      'recent',
      'dotcom',
      'enterprise',
      'other',
    ])
  })

  it('does not gate Pinned or Updates groups by recentRepositoriesThreshold', () => {
    // Only 2 repos (below threshold of 7) but pinned repo should still create Pinned group
    const repoPinned = new Repository(
      'pinned-repo',
      1,
      gitHubRepoFixture({ owner: 'me', name: 'pinned-repo' }),
      false
    )
    const repoBehind = new Repository(
      'behind-repo',
      2,
      gitHubRepoFixture({ owner: 'me', name: 'behind-repo' }),
      false
    )
    const cache = new Map<number, ILocalRepositoryState>()
    cache.set(2, { aheadBehind: { ahead: 0, behind: 1 }, changedFilesCount: 0 })

    const grouped = groupRepositories(
      [repoPinned, repoBehind],
      cache,
      [], // empty recent
      [1] // pinned repo id
    )

    const groupKinds = grouped.map(g => g.identifier.kind)
    // Should have Pinned and Updates even though total repos < threshold
    assert(groupKinds.includes('pinned'))
    assert(groupKinds.includes('updates'))
    // Should NOT have Recent group (threshold not met)
    assert(!groupKinds.includes('recent'))
  })
})
