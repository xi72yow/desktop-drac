import { describe, it } from 'node:test'
import assert from 'node:assert'
import { generateRepositoryListContextMenu } from '../../src/ui/repositories-list/repository-list-item-context-menu'
import { Repository } from '../../src/models/repository'
import { CloningRepository } from '../../src/models/cloning-repository'
import { gitHubRepoFixture } from '../helpers/github-repo-builder'

describe('repository list item context menu', () => {
  const repo = new Repository(
    'my-repo',
    1,
    gitHubRepoFixture({ owner: 'me', name: 'my-repo' }),
    false
  )

  const cloningRepo = new CloningRepository(
    '/tmp/repo',
    'https://example.com/repo'
  )

  const baseConfig = {
    repository: repo,
    shellLabel: undefined,
    externalEditorLabel: undefined,
    askForConfirmationOnRemoveRepository: false,
    onViewOnGitHub: () => {},
    onOpenInShell: () => {},
    onShowRepository: () => {},
    onOpenInExternalEditor: () => {},
    onRemoveRepository: () => {},
    onChangeRepositoryAlias: () => {},
    onRemoveRepositoryAlias: () => {},
  }

  it('shows "Pin Repository" when repo is not pinned', () => {
    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      isPinned: false,
      repositoryPinnable: true,
      onPinRepository: () => {},
    })

    const pinItem = items.find(
      item =>
        'label' in item &&
        (item.label === 'Pin Repository' || item.label === 'Pin repository')
    )
    assert.ok(pinItem, 'Should have "Pin Repository" menu item')
  })

  it('shows "Unpin Repository" when repo is pinned', () => {
    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      isPinned: true,
      repositoryPinnable: true,
      onUnpinRepository: () => {},
    })

    const unpinItem = items.find(
      item =>
        'label' in item &&
        (item.label === 'Unpin Repository' || item.label === 'Unpin repository')
    )
    assert.ok(unpinItem, 'Should have "Unpin Repository" menu item')
  })

  it('does not show pin/unpin for non-pinnable repos (cloning)', () => {
    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      repository: cloningRepo,
      isPinned: false,
      repositoryPinnable: false,
    })

    const pinItem = items.find(
      item =>
        'label' in item &&
        (item.label === 'Pin Repository' || item.label === 'Unpin Repository')
    )
    assert.equal(
      pinItem,
      undefined,
      'Should not have pin/unpin for cloning repos'
    )
  })

  it('calls onPinRepository when pin item is clicked', () => {
    let called = false
    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      isPinned: false,
      repositoryPinnable: true,
      onPinRepository: () => {
        called = true
      },
    })

    const pinItem = items.find(
      item =>
        'label' in item &&
        (item.label === 'Pin Repository' || item.label === 'Pin repository')
    ) as { label: string; action: () => void }

    assert.ok(pinItem, 'Should have pin item')
    pinItem.action()
    assert.equal(called, true, 'onPinRepository should be called')
  })

  it('calls onUnpinRepository when unpin item is clicked', () => {
    let called = false
    const items = generateRepositoryListContextMenu({
      ...baseConfig,
      isPinned: true,
      repositoryPinnable: true,
      onUnpinRepository: () => {
        called = true
      },
    })

    const unpinItem = items.find(
      item =>
        'label' in item &&
        (item.label === 'Unpin Repository' || item.label === 'Unpin repository')
    ) as { label: string; action: () => void }

    assert.ok(unpinItem, 'Should have unpin item')
    unpinItem.action()
    assert.equal(called, true, 'onUnpinRepository should be called')
  })
})
