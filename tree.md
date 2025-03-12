.
├── Architecture.png
├── DATAGEN.jpg
├── LICENSE
├── README.md
├── agent
│   ├── code_agent.py
│   ├── guidance.md
│   ├── hypothesis_agent.py
│   ├── note_agent.py
│   ├── process_agent.py
│   ├── quality_review_agent.py
│   ├── refiner_agent.py
│   ├── report_agent.py
│   ├── search_agent.py
│   └── visualization_agent.py
├── api_server.py
├── copy_guidance.py
├── copy_guidance.sh
├── core
│   ├── guidance.md
│   ├── language_models.py
│   ├── node.py
│   ├── router.py
│   ├── state.py
│   └── workflow.py
├── create_agent.py
├── data_storage
│   ├── other
│   ├── rapport
│   │   ├── FORMEEL_RAPPORT_final.docx
│   │   ├── word docu incl vragen en aanpassingen.docx
│   │   └── word docu incl vragen en aanpassingen.docx:Zone.Identifier
│   └── wics
│       ├── 2024
│       │   ├── wics_2024_01.html
│       │   ├── wics_2024_02.html
│       │   ├── wics_2024_03.html
│       │   ├── wics_2024_04.html
│       │   ├── wics_2024_05.html
│       │   ├── wics_2024_06.html
│       │   ├── wics_2024_07.html
│       │   ├── wics_2024_08.html
│       │   └── wics_2024_09.html
│       ├── 2025
│       ├── export
│       │   └── 2020.html
│       ├── guidance.md
│       ├── stockhis.html
│       ├── stockhis.xls
│       ├── stockhis_sample.html
│       └── test_creation.html
├── frontend
│   ├── DATAGEN-FRONTEND-README.md
│   ├── README.md
│   ├── components.json
│   ├── fix-lint-issues.sh
│   ├── next-env.d.ts
│   ├── next.config.mjs
│   ├── node_modules
│   │   ├── @radix-ui
│   │   │   ├── react-avatar -> ../.pnpm/@radix-ui+react-avatar@1.1.3_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react_ed81356e6adb04107a9c0929a995826c/node_modules/@radix-ui/react-avatar
│   │   │   ├── react-collapsible -> ../.pnpm/@radix-ui+react-collapsible@1.1.3_@types+react-dom@18.3.5_@types+react@18.3.18__@types+_b50db4bf24efeedd3a7854f67ade7a60/node_modules/@radix-ui/react-collapsible
│   │   │   ├── react-dialog -> ../.pnpm/@radix-ui+react-dialog@1.1.6_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react_963ba7435ac590a8053d1db2d26ca164/node_modules/@radix-ui/react-dialog
│   │   │   ├── react-dropdown-menu -> ../.pnpm/@radix-ui+react-dropdown-menu@2.1.6_@types+react-dom@18.3.5_@types+react@18.3.18__@type_fb9f8f03a80e7aaab5b8db38131e1c36/node_modules/@radix-ui/react-dropdown-menu
│   │   │   ├── react-label -> ../.pnpm/@radix-ui+react-label@2.1.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@_39ef6ff1fab5609543b645ba4602f392/node_modules/@radix-ui/react-label
│   │   │   ├── react-progress -> ../.pnpm/@radix-ui+react-progress@1.1.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+rea_64be1b99c396b1c11fd7f2c197955bd8/node_modules/@radix-ui/react-progress
│   │   │   ├── react-separator -> ../.pnpm/@radix-ui+react-separator@1.1.2_@types+react-dom@18.3.5_@types+react@18.3.18__@types+re_e069430f4793534a3e5922dcc5ebc25b/node_modules/@radix-ui/react-separator
│   │   │   ├── react-slot -> ../.pnpm/@radix-ui+react-slot@1.1.2_@types+react@18.3.18_react@18.3.1/node_modules/@radix-ui/react-slot
│   │   │   ├── react-tabs -> ../.pnpm/@radix-ui+react-tabs@1.1.3_@types+react-dom@18.3.5_@types+react@18.3.18__@types+react@1_30bbf95a4f1d1a4a60bb6175d5ee7048/node_modules/@radix-ui/react-tabs
│   │   │   └── react-tooltip -> ../.pnpm/@radix-ui+react-tooltip@1.1.8_@types+react-dom@18.3.5_@types+react@18.3.18__@types+reac_95283094e99ff394dd713b5a46c9c816/node_modules/@radix-ui/react-tooltip
│   │   ├── @tremor
│   │   │   └── react -> ../.pnpm/@tremor+react@3.18.7_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tremor/react
│   │   ├── @trivago
│   │   │   └── prettier-plugin-sort-imports -> ../.pnpm/@trivago+prettier-plugin-sort-imports@4.3.0_prettier@3.5.3/node_modules/@trivago/prettier-plugin-sort-imports
│   │   ├── @types
│   │   │   ├── node -> ../.pnpm/@types+node@20.17.24/node_modules/@types/node
│   │   │   ├── react -> ../.pnpm/@types+react@18.3.18/node_modules/@types/react
│   │   │   ├── react-dom -> ../.pnpm/@types+react-dom@18.3.5_@types+react@18.3.18/node_modules/@types/react-dom
│   │   │   ├── socket.io -> ../.pnpm/@types+socket.io@3.0.2/node_modules/@types/socket.io
│   │   │   ├── socket.io-client -> ../.pnpm/@types+socket.io-client@3.0.0/node_modules/@types/socket.io-client
│   │   │   ├── uuid -> ../.pnpm/@types+uuid@9.0.8/node_modules/@types/uuid
│   │   │   ├── winston -> ../.pnpm/@types+winston@2.4.4/node_modules/@types/winston
│   │   │   └── ws -> ../.pnpm/@types+ws@8.18.0/node_modules/@types/ws
│   │   ├── @typescript-eslint
│   │   │   ├── eslint-plugin -> ../.pnpm/@typescript-eslint+eslint-plugin@7.18.0_@typescript-eslint+parser@7.18.0_eslint@8.57.1__b5d500c70cbf070ea646ec6a62bbbf6a/node_modules/@typescript-eslint/eslint-plugin
│   │   │   └── parser -> ../.pnpm/@typescript-eslint+parser@7.18.0_eslint@8.57.1_typescript@5.8.2/node_modules/@typescript-eslint/parser
│   │   ├── axios -> .pnpm/axios@1.8.3/node_modules/axios
│   │   ├── class-variance-authority -> .pnpm/class-variance-authority@0.7.1/node_modules/class-variance-authority
│   │   ├── clsx -> .pnpm/clsx@2.1.1/node_modules/clsx
│   │   ├── eslint -> .pnpm/eslint@8.57.1/node_modules/eslint
│   │   ├── eslint-config-next -> .pnpm/eslint-config-next@14.2.24_eslint@8.57.1_typescript@5.8.2/node_modules/eslint-config-next
│   │   ├── lucide-react -> .pnpm/lucide-react@0.479.0_react@18.3.1/node_modules/lucide-react
│   │   ├── next -> .pnpm/next@14.2.24_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next
│   │   ├── next-themes -> .pnpm/next-themes@0.4.6_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/next-themes
│   │   ├── postcss -> .pnpm/postcss@8.5.3/node_modules/postcss
│   │   ├── prettier -> .pnpm/prettier@3.5.3/node_modules/prettier
│   │   ├── react -> .pnpm/react@18.3.1/node_modules/react
│   │   ├── react-dom -> .pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom
│   │   ├── react-dropzone -> .pnpm/react-dropzone@14.3.8_react@18.3.1/node_modules/react-dropzone
│   │   ├── recharts -> .pnpm/recharts@2.15.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/recharts
│   │   ├── socket.io -> .pnpm/socket.io@4.8.1/node_modules/socket.io
│   │   ├── socket.io-client -> .pnpm/socket.io-client@4.8.1/node_modules/socket.io-client
│   │   ├── sonner -> .pnpm/sonner@2.0.1_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/sonner
│   │   ├── swr -> .pnpm/swr@2.3.3_react@18.3.1/node_modules/swr
│   │   ├── tailwind-merge -> .pnpm/tailwind-merge@3.0.2/node_modules/tailwind-merge
│   │   ├── tailwindcss -> .pnpm/tailwindcss@3.4.17/node_modules/tailwindcss
│   │   ├── tailwindcss-animate -> .pnpm/tailwindcss-animate@1.0.7_tailwindcss@3.4.17/node_modules/tailwindcss-animate
│   │   ├── typescript -> .pnpm/typescript@5.8.2/node_modules/typescript
│   │   ├── uuid -> .pnpm/uuid@9.0.1/node_modules/uuid
│   │   ├── winston -> .pnpm/winston@3.17.0/node_modules/winston
│   │   ├── ws -> .pnpm/ws@8.18.1/node_modules/ws
│   │   ├── zod -> .pnpm/zod@3.24.2/node_modules/zod
│   │   └── zustand -> .pnpm/zustand@5.0.3_@types+react@18.3.18_react@18.3.1_use-sync-external-store@1.4.0_react@18.3.1_/node_modules/zustand
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── postcss.config.mjs
│   ├── src
│   │   ├── app
│   │   │   ├── api
│   │   │   │   ├── analysis
│   │   │   │   │   ├── [id]
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   └── route.ts
│   │   │   │   └── socket
│   │   │   │       └── route.ts
│   │   │   ├── dashboard
│   │   │   │   ├── analysis
│   │   │   │   │   └── id
│   │   │   │   ├── code
│   │   │   │   ├── page.tsx
│   │   │   │   ├── settings
│   │   │   │   └── visualizations
│   │   │   ├── favicon.ico
│   │   │   ├── fonts
│   │   │   │   ├── GeistMonoVF.woff
│   │   │   │   └── GeistVF.woff
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components
│   │   │   ├── analysis
│   │   │   │   ├── analysis-display.tsx
│   │   │   │   ├── analysis-status.tsx
│   │   │   │   ├── analysis-viewer.tsx
│   │   │   │   ├── recent-analyses.tsx
│   │   │   │   └── recent-analysis.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── code
│   │   │   │   └── code-display.tsx
│   │   │   ├── document
│   │   │   │   └── document-uploader.tsx
│   │   │   ├── layout
│   │   │   │   ├── dashboard-layout.tsx
│   │   │   │   └── header.tsx
│   │   │   ├── nav-main.tsx
│   │   │   ├── nav-projects.tsx
│   │   │   ├── nav-secondary.tsx
│   │   │   ├── nav-user.tsx
│   │   │   ├── shared
│   │   │   ├── theme-provider.tsx
│   │   │   └── ui
│   │   │       ├── avatar.tsx
│   │   │       ├── badge.tsx
│   │   │       ├── breadcrumb.tsx
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── collapsible.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── dropdown-menu.tsx
│   │   │       ├── input.tsx
│   │   │       ├── label.tsx
│   │   │       ├── progress.tsx
│   │   │       ├── separator.tsx
│   │   │       ├── sheet.tsx
│   │   │       ├── sidebar.tsx
│   │   │       ├── skeleton.tsx
│   │   │       ├── sonner.tsx
│   │   │       ├── tabs.tsx
│   │   │       ├── textarea.tsx
│   │   │       └── tooltip.tsx
│   │   ├── hooks
│   │   │   ├── use-analysis-real-time.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib
│   │   │   ├── data
│   │   │   │   └── jobs.ts
│   │   │   ├── file-processor.ts
│   │   │   ├── file-processors.ts
│   │   │   ├── logger.ts
│   │   │   ├── services
│   │   │   │   └── agent-services.ts
│   │   │   ├── utils.ts
│   │   │   ├── validations
│   │   │   │   └── analysis.ts
│   │   │   ├── websocket-client.ts
│   │   │   └── websocket-controller.ts
│   │   └── types
│   │       └── analysis.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── guidance.md
├── load_cfg.py
├── logger.py
├── main.ipynb
├── main.py
├── requirements.txt
├── tools
│   ├── FileEdit.py
│   ├── __init__.py
│   ├── basetool.py
│   ├── guidance.md
│   └── internet.py
├── tree.md
└── wics
    ├── 2024-export
    │   ├── wics_2024_01.html
    │   ├── wics_2024_02.html
    │   ├── wics_2024_03.html
    │   ├── wics_2024_04.html
    │   ├── wics_2024_05.html
    │   ├── wics_2024_06.html
    │   ├── wics_2024_07.html
    │   ├── wics_2024_08.html
    │   ├── wics_2024_09.html
    │   ├── wics_2024_10.html
    │   ├── wics_2024_11.html
    │   └── wics_2024_12.html
    └── 2025-export
        ├── wics_2025_01.html
        ├── wics_2025_02.html
        └── wics_2025_03.html

96 directories, 136 files
