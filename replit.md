# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web, com versão desktop executável, desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. O objetivo é otimizar as operações de bicicletários através de funcionalidades de cadastro, registro de movimentação, exportação de dados, sistema de auditoria completo e configurações personalizáveis, visando o mercado de lojas locais.

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
O sistema adota uma arquitetura modular baseada em Vanilla JavaScript (ES6+ Modules), HTML e CSS, utilizando Tailwind CSS para estilização e Lucide Icons para ícones. A persistência de dados é realizada via LocalStorage ou arquivos JSON, com suporte a um backend de armazenamento em arquivos para a versão web e um sistema de arquivos local para a versão desktop.

-   **UI/UX**:
    -   Interface responsiva com suporte a temas Claro, Escuro e detecção da preferência do sistema operacional.
    -   Modais para edições, confirmações e alertas, com animações suaves.
    -   Abas de navegação para diferentes módulos (Cadastros, Registros Diários, Configurações).
    -   Feedback visual para ações e seleções.
    -   Uso de toggle switches para permissões de usuário.

-   **Módulos Core**:
    -   **Cadastros**: Gerencia clientes (adição, busca, edição com validação de CPF, prevenção de duplicidade) e bicicletas (cadastro múltiplo por cliente, edição, visualização de histórico).
    -   **Registros Diários**: Controla registros de entrada/saída, com opções de "Registrar Saída", "Remover Acesso", "Alterar Registro", "Adicionar Outra Bike" e funcionalidade de "Pernoite" com ações diferenciadas para o dia seguinte.
    -   **Usuários**: Gerenciamento de perfis de funcionários com permissões granulares e relatório completo de auditoria com filtros por período e usuário, exportação em CSV e PDF.
    -   **Configuração**: Permite seleção de tema, busca avançada global, importação/exportação de dados completos do sistema (CSV, Excel) com mesclagem inteligente, exportação de registros de acesso por cliente (PDF, Excel) e visualização de histórico organizado de registros.
    -   **Shared**: Contém utilitários (formatação, validação de CPF, geração de UUID), funções para gerenciamento e migração de dados, e sistema de auditoria (AuditLogger).

-   **Fluxo de Dados**:
    -   Dados primariamente armazenados no LocalStorage com estruturas separadas para clientes e registros.
    -   Sistema de "snapshot" para bicicletas no momento da entrada.
    -   Estrutura de pastas separada por plataforma (`dados/navegador/` e `dados/desktop/`) para arquivos JSON de clientes e registros.
    -   A versão desktop utiliza arquivos JSON simplificados (`clientes.json`, `registros.json`) diretamente no diretório `dados/desktop/`.
    -   Fallback automático para localStorage quando a Storage API em arquivos não está acessível.

-   **Versão Desktop (Electron)**:
    -   Aplicações desktop executáveis (`.exe`) construídas com Electron, encapsulando a aplicação web.
    -   Utiliza `electron/storage-backend.js` para gerenciar o armazenamento de arquivos localmente através de IPC handlers.

## External Dependencies
-   **Tailwind CSS**: Framework CSS para estilização.
-   **Lucide Icons**: Biblioteca de ícones.
-   **SheetJS (xlsx)**: Biblioteca para leitura e escrita de arquivos Excel.
-   **LocalStorage**: Para persistência de dados no navegador.
-   **Python 3.12 HTTP Server**: Utilizado para servir a aplicação web e uma API de armazenamento em arquivos (`storage_api.py`) localmente.
-   **Electron**: Framework para construção de aplicações desktop multiplataforma.
-   **Electron Builder**: Ferramenta para empacotamento e distribuição de aplicações Electron.

## Replit Environment Setup
### Recent Changes (November 21, 2025)

#### Phase 1: Initial Setup
-   **Initial Replit Setup**: Imported GitHub project and configured for Replit environment
    -   Python 3.12 already available in environment
    -   Configured workflow "Web Server" to run `python3 server.py` on port 5000
    -   Added `.gitignore` file to exclude `node_modules/`, `dist/`, `dados/`, Python cache, and temporary files
    -   Configured autoscale deployment for production
    -   Web server successfully running on port 5000 with Storage API on port 5001
    -   Application uses localStorage as fallback when file storage API is not accessible (expected behavior)

#### Phase 2: Sistema de Auditoria
-   **Sistema de Auditoria**: Sistema completo de rastreamento de ações dos usuários já implementado:
    -   Módulo AuditLogger (js/shared/audit-logger.js) que registra todas as operações CRUD
    -   Logging automático em clientes, bicicletas, registros, usuários e autenticação
    -   Interface de relatório na aba Usuários com filtros por período e usuário
    -   Exportação de relatórios em CSV e PDF
    -   Limite de 5.000 registros com rotação automática

#### Phase 3: Sistema de Permissões por Perfil (NEW - 21/11/2025)
-   **Sistema de Controle de Acesso**: Implementação completa de permissões granulares
    -   Módulo Auth expandido com `hasPermission()` e `requirePermission()`
    -   Três perfis: dono (acesso total), admin (acesso amplo), funcionário (permissões limitadas)
    -   Permissões por módulo: clientes, registros, configuracao, usuarios
    -   Proteção em dois níveis: UI (renderização) e Runtime (execução de funções)
    -   Verificação de permissão em TODOS os módulos: clientes.js, bicicletas.js, registros-diarios.js, configuracao.js, usuarios.js
    -   Funções `applyPermissionsToUI()` em cada módulo para esconder elementos não autorizados
    -   Filtro automático de abas visíveis baseado em permissões

#### Phase 4: Sistema de Exportação/Importação (NEW - 21/11/2025)
-   **Exportação Completa de Dados**:
    -   Exportação para Excel (.xlsx) com 3 abas: Clientes, Registros, Usuários
    -   Exportação para CSV com 4 seções
    -   Bicicletas integradas como JSON dentro de cada cliente (nova estrutura compacta)
    -   Inclui todos os registros de acesso (entrada, saída, pernoite, acesso removido)
-   **Importação Inteligente de Dados**:
    -   Aceita arquivos Excel (.xlsx) ou CSV
    -   Mesclagem automática baseada em CPF (clientes) e ID (registros, usuários)
    -   Evita duplicatas automaticamente
    -   Compatibilidade com formato antigo (bicicletas em aba separada) e novo (JSON integrado)
    -   Estatísticas de mesclagem exibidas ao usuário
-   **Ciclo Completo**: Exportar → Importar funciona 100% com todos os dados preservados

### Running on Replit
-   **Development**: O servidor Python roda automaticamente em `http://0.0.0.0:5000/`
-   **Web Server**: `server.py` serve arquivos estáticos e inicia a Storage API na porta 5001
-   **Data Storage**: Dados são salvos em `dados/navegador/` para a versão web
-   **Deployment**: Configurado para "autoscale" deployment - ideal para aplicações web sem estado
-   **Default Credentials**: admin / admin123 (conforme documentado no HTML)

### File Structure on Replit
```
/
├── server.py              # Servidor web principal (porta 5000)
├── storage_api.py         # API de armazenamento em arquivos (porta 5001)
├── index.html             # Página principal da aplicação
├── style.css              # Estilos customizados
├── js/                    # Módulos JavaScript
│   ├── cadastros/         # Módulos de cadastro (clientes, bicicletas)
│   ├── registros/         # Módulos de registro diário
│   ├── usuarios/          # Módulo de gerenciamento de usuários e auditoria
│   ├── configuracao/      # Módulo de configuração
│   └── shared/            # Utilitários compartilhados (auth, modals, audit-logger, utils)
├── libs/                  # Bibliotecas externas (Tailwind, Lucide, XLSX)
├── electron/              # Arquivos da versão desktop (não usado no Replit)
├── dados/                 # Dados persistidos (gitignored)
│   └── navegador/         # Dados da versão web
└── docs/                  # Documentação do projeto
```