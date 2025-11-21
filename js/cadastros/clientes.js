import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { logAction } from '../shared/audit-logger.js';

export class ClientesManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            addClientForm: document.getElementById('add-client-form'),
            cpfInput: document.getElementById('cpf'),
            cpfError: document.getElementById('cpf-error'),
            telefoneInput: document.getElementById('telefone'),
            searchInput: document.getElementById('search'),
            clientList: document.getElementById('client-list'),
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            editClientModal: document.getElementById('edit-client-modal'),
            editClientForm: document.getElementById('edit-client-form'),
            editClientId: document.getElementById('edit-client-id'),
            editClientNome: document.getElementById('edit-client-nome'),
            editClientCpf: document.getElementById('edit-client-cpf'),
            editClientTelefone: document.getElementById('edit-client-telefone'),
            editCpfError: document.getElementById('edit-cpf-error'),
            cancelEditClient: document.getElementById('cancel-edit-client'),
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const nomeInput = document.getElementById('nome');
        
        this.elements.addClientForm.addEventListener('submit', this.handleAddClient.bind(this));
        this.elements.searchInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.renderClientList(e.target.value);
        });
        
        nomeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.cpfInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });
        this.elements.telefoneInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatTelefone(e.target.value);
        });
        this.elements.editClientForm.addEventListener('submit', this.handleEditClient.bind(this));
        this.elements.cancelEditClient.addEventListener('click', () => this.app.toggleModal('edit-client-modal', false));
        
        this.elements.editClientNome.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.editClientCpf.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });
        this.elements.editClientTelefone.addEventListener('input', (e) => {
            e.target.value = Utils.formatTelefone(e.target.value);
        });
    }

    handleAddClient(e) {
        e.preventDefault();
        
        try {
            Auth.requirePermission('clientes', 'adicionar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const formData = new FormData(this.elements.addClientForm);
        const nome = formData.get('nome');
        const cpf = formData.get('cpf');
        const telefone = formData.get('telefone');
        
        this.elements.cpfError.classList.add('hidden');
        this.elements.cpfInput.classList.remove('border-red-500');

        if (!Utils.validateCPF(cpf)) {
            this.elements.cpfError.textContent = 'CPF inválido.';
            this.elements.cpfError.classList.remove('hidden');
            this.elements.cpfInput.classList.add('border-red-500');
            return;
        }

        if(this.app.data.clients.some(c => c.cpf === cpf)) {
            this.elements.cpfError.textContent = 'CPF já cadastrado.';
            this.elements.cpfError.classList.remove('hidden');
            this.elements.cpfInput.classList.add('border-red-500');
            return;
        }

        const newClient = { id: Utils.generateUUID(), nome, cpf, telefone, bicicletas: [] };
        this.app.data.clients.push(newClient);
        Storage.saveClients(this.app.data.clients);
        
        logAction('create', 'cliente', newClient.id, { nome, cpf, telefone });
        
        this.renderClientList();
        this.elements.addClientForm.reset();
    }

    renderClientList(filter = '') {
        const lowercasedFilter = filter.toLowerCase();
        const numericFilter = filter.replace(/\D/g, '');
        
        const filteredClients = this.app.data.clients.filter(client => {
            const nome = client.nome.toLowerCase();
            const cpf = client.cpf.replace(/\D/g, '');
            const telefone = client.telefone.replace(/\D/g, '');
            
            const matchesName = nome.includes(lowercasedFilter);
            const matchesCPF = numericFilter.length > 0 && cpf.includes(numericFilter);
            const matchesTelefone = numericFilter.length > 0 && telefone.includes(numericFilter);
            
            return matchesName || matchesCPF || matchesTelefone;
        }).sort((a,b) => a.nome.localeCompare(b.nome));

        if (filteredClients.length === 0) {
            this.elements.clientList.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum cliente encontrado.</p>`;
            return;
        }
        
        this.elements.clientList.innerHTML = filteredClients.map(client => `
            <div class="client-item p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700/50 dark:hover:border-blue-500 ${this.app.data.selectedClientId === client.id ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/50 dark:border-blue-500' : ''}" data-id="${client.id}">
                <p class="font-semibold text-slate-800 dark:text-slate-100">${client.nome.replace(/^"|"$/g, '')}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}${client.telefone ? ' • ' + Utils.formatTelefone(client.telefone) : ''}</p>
            </div>
        `).join('');

        this.elements.clientList.querySelectorAll('.client-item').forEach(item => {
            item.addEventListener('click', () => {
                this.app.data.selectedClientId = item.dataset.id;
                this.app.bicicletasManager.renderClientDetails();
                this.renderClientList(this.elements.searchInput.value);
            });
        });
    }

    openEditClientModal(clientId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        this.elements.editClientId.value = client.id;
        this.elements.editClientNome.value = client.nome;
        this.elements.editClientCpf.value = Utils.formatCPF(client.cpf);
        this.elements.editClientTelefone.value = Utils.formatTelefone(client.telefone);
        this.elements.editCpfError.classList.add('hidden');
        this.elements.editClientCpf.classList.remove('border-red-500');

        this.app.toggleModal('edit-client-modal', true);
    }

    handleEditClient(e) {
        e.preventDefault();
        
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const clientId = this.elements.editClientId.value;
        const nome = this.elements.editClientNome.value;
        const cpfFormatted = this.elements.editClientCpf.value;
        const cpf = cpfFormatted.replace(/\D/g, '');
        const telefone = this.elements.editClientTelefone.value;

        this.elements.editCpfError.classList.add('hidden');
        this.elements.editClientCpf.classList.remove('border-red-500');

        if (!Utils.validateCPF(cpf)) {
            this.elements.editCpfError.textContent = 'CPF inválido.';
            this.elements.editCpfError.classList.remove('hidden');
            this.elements.editClientCpf.classList.add('border-red-500');
            return;
        }

        const cpfExists = this.app.data.clients.some(c => c.id !== clientId && c.cpf.replace(/\D/g, '') === cpf);
        if (cpfExists) {
            this.elements.editCpfError.textContent = 'CPF já cadastrado para outro cliente.';
            this.elements.editCpfError.classList.remove('hidden');
            this.elements.editClientCpf.classList.add('border-red-500');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            const oldData = { nome: client.nome, cpf: client.cpf, telefone: client.telefone };
            client.nome = nome;
            client.cpf = cpf;
            client.telefone = telefone;
            Storage.saveClients(this.app.data.clients);
            
            logAction('edit', 'cliente', clientId, { 
                nome, 
                cpf, 
                telefone,
                changes: { before: oldData, after: { nome, cpf, telefone } }
            });
            
            this.renderClientList(this.elements.searchInput.value);
            this.app.bicicletasManager.renderClientDetails();
            this.app.toggleModal('edit-client-modal', false);
        }
    }

    applyPermissionsToUI() {
        const addClientSection = document.querySelector('#clientes-tab-content .bg-white.rounded-lg.shadow-sm.p-6');
        
        if (!Auth.hasPermission('clientes', 'adicionar')) {
            if (addClientSection) {
                addClientSection.style.display = 'none';
            }
            const submitBtn = this.elements.addClientForm?.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;
        } else {
            if (addClientSection) {
                addClientSection.style.display = '';
            }
        }

        if (!Auth.hasPermission('clientes', 'editar')) {
            document.querySelectorAll('.edit-client-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }
}
