# Hosting the BattleChain `.mcpb` bundle

The "Download the BattleChain extension" button on
`content/battlechain/quickstart/claude-desktop-demo.mdx` (the `<InstallButton />`
component) links to a **GitHub release asset**, not a file committed to this repo.

## Where it lives

- **Release:** https://github.com/Cyfrin/docs-battlechain/releases/tag/mcpb-v1.0.0
- **Download URL (what the button uses):**
  `https://github.com/Cyfrin/docs-battlechain/releases/download/mcpb-v1.0.0/battlechain.mcpb`

The 10 MB binary is intentionally **not** committed (`public/downloads/*.mcpb` is
gitignored). A local copy under `public/downloads/` is only for offline `npm run dev`.

## To publish an updated bundle

The bundle is built from the **`battlechain-mcp-node`** project (Node/TypeScript port
of the MCP server). From that project:

```bash
npm run pack            # tsc + mcpb pack → battlechain.mcpb
# replace the asset on the existing release:
gh release upload mcpb-v1.0.0 battlechain.mcpb --clobber --repo Cyfrin/docs-battlechain
```

Or cut a new tag (e.g. `mcpb-v1.1.0`) and bump the `href` default in
`components/mdx/InstallButton.tsx` to match.

## ⚠️ Open items — needs an owner

1. **The MCP source has no permanent home.** `battlechain-mcp-node` currently lives
   only as a local working directory. It should be committed to a repo (its own, or a
   `node` branch on `Cyfrin/battlechain-mcp`) so the `.mcpb` is reproducible from
   source. Until then, this release asset is the only copy of the built artifact.
2. **Hosting location is provisional.** Parking the bundle on the *docs* repo's
   releases works but is a bit incongruous. Consider hosting it on
   `Cyfrin/battlechain-mcp` releases alongside the source once (1) is done, and
   update the button `href` accordingly.
3. **Windows install is unverified end-to-end.** Double-clicking `.mcpb` may not work
   (no file association); the docs now lead with the in-app **Install Extension…**
   path. The native-Windows run of `prepare_environment` (Foundry download + build)
   has not been confirmed on real hardware.
