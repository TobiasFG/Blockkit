# Graph Report - Blockkit  (2026-05-10)

## Corpus Check
- 282 files · ~99,972 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1708 nodes · 2700 edges · 86 communities (76 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 114 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eb669bdc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]

## God Nodes (most connected - your core abstractions)
1. `$lib/utils.js` - 103 edges
2. `$lib/Sidebar/Sidebar.svelte` - 44 edges
3. `$lib/components/ui/sidebar/index.ts` - 28 edges
4. `$lib/components/cms/BlockListEditor.svelte` - 24 edges
5. `$lib/components/ui/dropdown-menu/index.ts` - 20 edges
6. `getPages()` - 19 edges
7. `getReusableBlocks()` - 18 edges
8. `$lib/components/ui/button/index.js` - 17 edges
9. `./SidebarPageTreeItem.svelte` - 15 edges
10. `getPageById()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Svelte App HTML Shell` --references--> `Static Favicon Asset`  [INFERRED]
  src/app.html → static/favicon.png
- `handleRemoveBlock()` --calls--> `removeNestedReusableBlockAtPath()`  [INFERRED]
  src/routes/content/[id]/+page.svelte → src/lib/reusableBlockEditor.ts
- `handleMoveBlock()` --calls--> `moveNestedReusableBlock()`  [INFERRED]
  src/routes/content/[id]/+page.svelte → src/lib/reusableBlockEditor.ts
- `SvelteKit Runtime Config` --conceptually_related_to--> `Vitest Client Server Workspace`  [INFERRED]
  svelte.config.js → vite.config.ts
- `Auth Flow E2E Test` --conceptually_related_to--> `Auth E2E Preview Server`  [INFERRED]
  e2e/demo.test.ts → playwright.config.ts

## Hyperedges (group relationships)
- **Page Draft Published Version Flow** — Page_page_model, PageVersion_page_version_model, seed_home_page_seed [EXTRACTED 1.00]
- **Reusable Block Versioning Flow** — ReusableBlock_reusable_block_model, ReusableBlockVersion_reusable_block_version_model, BlockFolder_block_folder_model [EXTRACTED 1.00]
- **Client And E2E Test Stack** — vite_config_vitest_workspace, vitest_setup_client_matchmedia_mock, playwright_config_auth_e2e_server, demo_test_auth_flow [INFERRED 0.80]
- **Sidebar Responsive State Flow** — sidebar_provider_persistent_state, sidebar_context_state, sidebar_root_responsive_shell, sidebar_desktop_collapse_modes, sidebar_mobile_sheet_mode, sidebar_trigger_toggle_control, sidebar_rail_resize_toggle [EXTRACTED 0.95]
- **Sidebar Navigation Composition Flow** — sidebar_root_responsive_shell, sidebar_group_structure, sidebar_menu_composition, sidebar_menu_button_behavior, sidebar_menu_item_affordances, sidebar_submenu_structure [INFERRED 0.82]
- **Collapsed Sidebar Tooltip Label Flow** — sidebar_context_state, sidebar_menu_button_behavior, tooltip_primitive_wrappers, tooltip_content_portal_arrow [EXTRACTED 0.94]
- **Card Section Composition Flow** — card_composition_system, card_header_action_layout [EXTRACTED 0.90]
- **Authenticated Workspace Flow** — cms_layout_data_gate, layout_client_store_sync, cms_shell_authenticated_workspace, theme_toggle_mode_control, dashboard_operational_overview [EXTRACTED 0.94]
- **Auth Login Signup Transition Flow** — auth_route_action_flow, auth_page_transition_flow, auth_rail_form_surface, auth_preview_stage_motion, theme_toggle_mode_control [EXTRACTED 0.96]
- **Content Library Mutation Flow** — content_library_server_actions, content_library_management_page, reusable_block_library_tree_item, cms_action_modal_confirmation, cms_empty_state_prompt, layout_client_store_sync [EXTRACTED 0.95]
- **Editor Support Components Flow** — block_list_editor_nested_composer, cms_icon_button_accessible_wrapper, cms_action_modal_confirmation, typography_component_family, typography_size_token_system, shared_icon_export_surface [INFERRED 0.82]
- **Content Library To Page Composition Workflow** — design_content_library_workflow, design_page_reusable_block_refs, design_page_editor_sidebar_drag_drop, design_page_content_editor [INFERRED 0.91]
- **Shared Content Governance** — design_page_reusable_block_refs, design_reusable_block_nested_editing, design_reusable_block_draft_publish, design_trash_restore_workflow [INFERRED 0.88]
- **CMS Editor Shell Visual System** — design_cms_visual_direction, design_edit_page_rebuild, design_dashboard_primary_workflow, design_dashboard_content_editor_refresh [INFERRED 0.90]
- **Page Versioned Content Model** — design_block_content_model, design_page_seo_metadata, design_page_content_editor, design_edit_page_rebuild [INFERRED 0.89]
- **CMS Access And Feedback System** — design_supabase_auth_login, design_cms_toast_manager, design_trash_restore_workflow, design_cms_visual_direction [INFERRED 0.82]

## Communities (86 total, 10 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (101): BLOCK_REGISTRY, BlockDefinition, BlockFieldDefinition, BlockFieldType, getBlockDefinition(), Block content model, Page content editor invariants, Reusable block editor invariants (+93 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (109): Args, At, AtLeast, AtLoose, AtStrict, BatchPayload, BlockFolderScalarFieldEnum, Boolean (+101 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (61): AggregateBlockFolder, BlockFolderAggregateArgs, BlockFolderAvgAggregateInputType, BlockFolderAvgAggregateOutputType, BlockFolderAvgOrderByAggregateInput, BlockFolderCountAggregateInputType, BlockFolderCountAggregateOutputType, BlockFolderCountArgs (+53 more)

### Community 3 - "Community 3"
Cohesion: 0.03
Nodes (61): AggregatePageVersion, GetPageVersionAggregateType, GetPageVersionGroupByPayload, NullableIntFieldUpdateOperationsInput, PageVersionAggregateArgs, PageVersionAvgAggregateInputType, PageVersionAvgAggregateOutputType, PageVersionAvgOrderByAggregateInput (+53 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (60): AggregateReusableBlockVersion, GetReusableBlockVersionAggregateType, GetReusableBlockVersionGroupByPayload, Prisma__ReusableBlockVersionClient, ReusableBlockVersionAggregateArgs, ReusableBlockVersionAvgAggregateInputType, ReusableBlockVersionAvgAggregateOutputType, ReusableBlockVersionAvgOrderByAggregateInput (+52 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (12): @lucide/svelte/icons/chevron-right, svelte/elements, @lucide/svelte/icons/loader-2, @lucide/svelte/icons/more-horizontal, @lucide/svelte/icons/panel-left, Sidebar state contract, $lib/components/ui/alert/index.ts, $lib/components/ui/breadcrumb/index.ts (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.03
Nodes (58): AggregatePage, DateTimeFieldUpdateOperationsInput, GetPageAggregateType, GetPageGroupByPayload, NullableDateTimeFieldUpdateOperationsInput, NullableStringFieldUpdateOperationsInput, PageAggregateArgs, PageCountAggregateInputType (+50 more)

### Community 7 - "Community 7"
Cohesion: 0.04
Nodes (54): AggregateReusableBlock, GetReusableBlockAggregateType, GetReusableBlockGroupByPayload, Prisma__ReusableBlockClient, ReusableBlockAggregateArgs, ReusableBlockCountAggregateInputType, ReusableBlockCountAggregateOutputType, ReusableBlockCountArgs (+46 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (34): pagesStore, blockFoldersStore, reusableBlocksStore, Draft/publish state, Parent-based page paths, getDraftStateLabel(), buildEditPagePath(), buildPagePathMap() (+26 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (47): DateTimeFilter, DateTimeNullableFilter, DateTimeNullableWithAggregatesFilter, DateTimeWithAggregatesFilter, IntFilter, IntNullableFilter, IntNullableWithAggregatesFilter, IntWithAggregatesFilter (+39 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (8): @lucide/svelte/icons/check, @lucide/svelte/icons/minus, ./alert-dialog-overlay.svelte, ./alert-dialog-portal.svelte, $lib/components/ui/collapsible/index.ts, ./dropdown-menu-portal.svelte, $lib/components/ui/dropdown-menu/index.ts, $lib/components/ui/tooltip/index.ts

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (40): Child publish behavior, CMS edit routing, Create flow, Current model, Dashboard and sidebar, Data entry, Derived full path, Draft vs live display (+32 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (26): @lucide/svelte/icons/command, $app/navigation, actionPending, activePageId, activeReusableBlockId, canDragReusableBlocks, canInsertIntoCurrentPage, currentBlockFolders (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (29): Actions, Block folders, code:ts (type BlockFolder = {), code:ts (type ReusableBlock = {), Create block, Create folder, Data validation, Database shape (+21 more)

### Community 14 - "Community 14"
Cohesion: 0.1
Nodes (13): action, id, state, createToastId(), ShowToastInput, TOAST_STATE_KEY, ToastAction, ToastRecord (+5 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (24): content, folderIdRaw, id, name, parentIdRaw, Reusable block version lifecycle, createBlockFolder(), createReusableBlock() (+16 more)

### Community 16 - "Community 16"
Cohesion: 0.17
Nodes (25): serializePageContent(), buildPathMaps(), createCleanDraftFromPublishedVersion(), createPage(), getDraftVersionById(), getNextPageRevision(), getPageById(), getPagesReferencingReusableBlock() (+17 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (26): CMS behavior, code:ts (type ReusableBlock = {), Database shape, Decision, Delete, Draft visibility decision, Existing context, Follow-ups (+18 more)

### Community 18 - "Community 18"
Cohesion: 0.08
Nodes (18): actionMotion, currentDefinition, handleMoveBlock(), handleRemoveBlock(), hasUnsavedChanges, hasValidationErrors, primaryActionDisabled, primaryActionFormAction (+10 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (24): Accessibility, Color, Design direction, Feedback and recovery, Follow-ups, Goals, Header and status, Implementation plan after approval (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.08
Nodes (10): $lib/components/ui/avatar/index.ts, $lib/components/ui/badge/index.ts, $lib/components/ui/input/index.ts, $lib/components/ui/label/index.ts, $lib/components/ui/progress/index.ts, $lib/components/ui/separator/index.ts, $lib/components/ui/skeleton/index.ts, $lib/components/ui/spinner/index.ts (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.08
Nodes (23): Content editor, Content editor, Content editor layout, Content requirements, Dashboard, Dashboard, Dashboard layout, Design direction (+15 more)

### Community 22 - "Community 22"
Cohesion: 0.08
Nodes (23): Auth client architecture, Current context, Data access safety, Decisions after review, Follow-ups, Goals, Implementation slices after approval, Non-goals (+15 more)

### Community 23 - "Community 23"
Cohesion: 0.13
Nodes (17): fromPath, getBlockDefinition(), isReusableBlockReference(), reusablePayload, $app/forms, $lib/components/auth/AuthPreviewStage.svelte, $lib/components/auth/AuthRail.svelte, $lib/components/cms/BlockListEditor.svelte (+9 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (18): listBlockDefinitions(), blockType, folderIdRaw, getPagesReferencingReusableBlockMap(), id, load(), name, parentIdRaw (+10 more)

### Community 25 - "Community 25"
Cohesion: 0.09
Nodes (21): Content, Content usage detection, Data model, Delete behavior, Dependency handling, Docs, Follow-ups, Goals (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.09
Nodes (21): Block definitions, Block instance shape, code:ts (type PageContent = {), code:ts (type BlockFieldType = 'string' | 'date' | 'number' | 'boolea), code:ts (type BlockValue = string | number | boolean | null | BlockIn), code:json ({), Date handling, Definition storage (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.14
Nodes (22): Block folder empty delete rule, Collapsed sidebar rail, Expanded sidebar content, Page draft/publish model, Page path derivation model, Page trash policy, Page tree item publish indicators, Reusable block content validation (+14 more)

### Community 28 - "Community 28"
Cohesion: 0.1
Nodes (19): BlockFolderScalarFieldEnum, JsonNullValueFilter, JsonNullValueInput, ModelName, NullableJsonNullValueInput, NullsOrder, NullTypes, PageScalarFieldEnum (+11 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (18): displayName, initials, folderName, isOpen, nodeId, rowPadding, ./SidebarReusableBlockRow.svelte, ./SidebarReusableBlocksTreeItem.svelte (+10 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (16): Page SEO metadata, contentErrors, currentSeo, descendantIds, parentPage, reusableBlockIds, seo, validation (+8 more)

### Community 31 - "Community 31"
Cohesion: 0.1
Nodes (19): Accessibility, Behavioral rules, Current targets, Follow-ups, Goals, Integration model, Non-goals, Open questions (+11 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (20): Auth Page Transition Flow, Auth Preview Stage Motion, Auth Rail Form Surface, Auth Route Action Flow, Block List Editor Nested Composer, CMS Action Modal Confirmation, CMS Empty State Prompt, CMS Icon Button Accessible Wrapper (+12 more)

### Community 33 - "Community 33"
Cohesion: 0.14
Nodes (7): cn(), WithElementRef, WithoutChild, WithoutChildren, WithoutChildrenOrChild, $lib/components/ui/sheet/index.ts, @lucide/svelte/icons/x

### Community 34 - "Community 34"
Cohesion: 0.11
Nodes (17): Behavior details, Current model, Dashboard and sidebar, Data returned to UI, Decision needed, Follow-ups, Goals, Non-goals (+9 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (17): Content Editor UX, Follow-Ups, Goals, Implementation Plan After Approval, Information Architecture, Interaction Model, Nested block fields, Non-goals (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.11
Nodes (17): code:ts (type PageBlockNode = BlockInstance | ReusableBlockReference;), Data loading and save behavior, Decision: use live references in the first iteration, Editor UX, Existing constraints, Follow-ups, Goal, Implementation plan after approval (+9 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (13): @lucide/svelte/icons/moon, attentionItems, deletedCount, publishedPages, quickActions, recentPages, statCards, unpublishedBlocks (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (14): load(), getDeletedPages(), getDeletedPagesReferencingParent(), getPageRows(), getPages(), getDeletedReusableBlocks(), getReusableBlockRows(), restoreReusableBlock() (+6 more)

### Community 39 - "Community 39"
Cohesion: 0.14
Nodes (9): IsMobile, Getter, SidebarState, SidebarStateProps, useSidebar(), ./constants.js, ./context.svelte.js, $lib/components/ui/sheet/index.js (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.12
Nodes (15): Behavior, CMS edit page changes, code:ts (type PageSeoMeta = {), code:json ({), Data access changes, Follow-up, Goal, Implementation notes (+7 more)

### Community 41 - "Community 41"
Cohesion: 0.15
Nodes (16): Block Content Model, CMS Toast Manager, CMS Visual Direction, Content Library Workflow, Dashboard And Content Editor Refresh, Dashboard Primary Workflow, Edit Page Rebuild, Page Content Editor (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.13
Nodes (14): Data model and save behavior, Defaults and decisions, Existing constraints, Follow-ups, Goal, Implementation plan after approval, Non-goals, Open questions (+6 more)

### Community 43 - "Community 43"
Cohesion: 0.13
Nodes (14): Data model and save behavior, Defaults and decisions, Existing constraints, Follow-ups, Goal, Implementation plan after approval, Non-goals, Open questions (+6 more)

### Community 44 - "Community 44"
Cohesion: 0.34
Nodes (12): Reusable block soft-delete visibility, ensurePageCanBeDeleted(), removeReusableBlockReferencesFromPageContent(), removeReusableBlockReferencesFromPages(), softDeletePageById(), deleteBlockFolder(), softDeleteReusableBlock(), trashPage() (+4 more)

### Community 45 - "Community 45"
Cohesion: 0.23
Nodes (14): Sidebar Context State, Desktop Sidebar Collapse Modes, Sidebar Group Structure, Sidebar Menu Button Behavior, Sidebar Menu Composition, Sidebar Menu Item Affordances, Mobile Sidebar Sheet Mode, Sidebar Provider Persistent State (+6 more)

### Community 46 - "Community 46"
Cohesion: 0.18
Nodes (9): isOpen, nodeId, $lib/components/cms/ActionModal.svelte, $lib/blocks/registry, $lib/components/ui/alert-dialog/index.js, $lib/components/ui/label/index.js, $lib/reusableBlockStatus, $lib/Sidebar/Index (+1 more)

### Community 47 - "Community 47"
Cohesion: 0.23
Nodes (4): $lib/components/ui/button-group/index.ts, ./DevSidebarFrame.svelte, ./DevSidebarPageItem.svelte, $lib/components/ui/separator/index.js

### Community 48 - "Community 48"
Cohesion: 0.26
Nodes (13): Reusable Block Version Alignment Migration, Soft Delete Markers Migration, Block Folder Model, Page Version Model, Page Model, Reusable Block Version Model, Reusable Block Model, Browser Prisma Surface (+5 more)

### Community 49 - "Community 49"
Cohesion: 0.18
Nodes (6): svelte/easing, $lib/Toasts/ToastProvider.svelte, restoreButton, restoreForm, $lib/components/ui/progress, $lib/Toasts/ToastState.svelte

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (3): @lucide/svelte/icons/chevron-down, @lucide/svelte/icons/chevron-up, $lib/components/ui/select/index.ts

### Community 51 - "Community 51"
Cohesion: 0.21
Nodes (3): Tabs variant contract, $lib/components/ui/button/index.ts, $lib/components/ui/tabs/index.ts

### Community 52 - "Community 52"
Cohesion: 0.17
Nodes (11): Approved Decisions, Design Direction, Feature Summary, Follow-Ups, Layout Strategy, Open Questions, Primary User Action, Proposed Defaults (+3 more)

### Community 53 - "Community 53"
Cohesion: 0.17
Nodes (11): Approved Decisions, Follow-Ups, Implementation Notes, Interaction Model, Open Questions, Primary User Action, Proposed Defaults, Review Points (+3 more)

### Community 54 - "Community 54"
Cohesion: 0.2
Nodes (8): BlockFolder, Page, PageVersion, PrismaClient, ReusableBlock, ReusableBlockVersion, adapter, globalForPrisma

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (10): isActive, isOpen, pageHref, publishState, rowPadding, statusDotClass, statusLabel, ./SidebarPageTreeItem.svelte (+2 more)

### Community 56 - "Community 56"
Cohesion: 0.27
Nodes (7): $app/environment, defaultParentSelection(), parentOptions(), ../app.css, $lib/client/pagesStore, $lib/client/reusableBlocksStore, ./$types

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (6): createReusableBlockDragData(), ReusableBlockInsertHandler, reusableBlockInsertHandlers, ReusableBlockInsertionPayload, ReusableBlockInsertRequest, setReusableBlockDragData()

### Community 58 - "Community 58"
Cohesion: 0.2
Nodes (9): Approved Decisions, Feature Summary, Follow-Ups, Open Questions, Primary User Action, Proposed Defaults, Review Points, Risks (+1 more)

### Community 59 - "Community 59"
Cohesion: 0.2
Nodes (9): Approved Decisions, Distillation, Feature Summary, Follow-Ups, Open Questions, Primary User Action, Proposed Defaults, Review Points (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 61 - "Community 61"
Cohesion: 0.47
Nodes (4): Supabase session validation, Locals, getSupabasePublicEnv(), handle()

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (5): Agent Docs, Blockkit, Note, Setup, Verify

### Community 64 - "Community 64"
Cohesion: 0.5
Nodes (3): headingSizeClasses, textSizeClasses, TypographySize

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (3): SvelteKit Runtime Config, Vitest Client Server Workspace, Client MatchMedia Mock

### Community 68 - "Community 68"
Cohesion: 0.67
Nodes (3): Toast provider context, Toast state manager, Toast viewport renderer

## Knowledge Gaps
- **982 isolated node(s):** `config`, `Page`, `PageVersion`, `BlockFolder`, `ReusableBlock` (+977 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `$lib/utils.js` connect `Community 5` to `Community 33`, `Community 39`, `Community 10`, `Community 47`, `Community 50`, `Community 51`, `Community 20`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Why does `$lib/Sidebar/Sidebar.svelte` connect `Community 12` to `Community 37`, `Community 8`, `Community 46`, `Community 47`, `Community 55`, `Community 23`, `Community 24`, `Community 56`, `Community 29`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `$lib/components/cms/CmsShell.svelte` connect `Community 12` to `Community 37`, `Community 47`, `Community 49`, `Community 23`, `Community 24`, `Community 56`, `Community 29`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `config`, `Page`, `PageVersion` to the rest of the system?**
  _982 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._