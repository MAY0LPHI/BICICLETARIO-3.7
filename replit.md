# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web, com versão desktop executável, desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. O objetivo é otimizar as operações de bicicletários através de funcionalidades de cadastro, registro de movimentação, exportação de dados e configurações personalizáveis, visando o mercado de lojas locais.

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
    -   **Configuração**: Permite seleção de tema, busca avançada global, importação/exportação de dados completos do sistema (CSV, Excel) com mesclagem inteligente, exportação de registros de acesso por cliente (PDF, Excel) e visualização de histórico organizado de registros.
    -   **Shared**: Contém utilitários (formatação, validação de CPF, geração de UUID) e funções para gerenciamento e migração de dados.

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