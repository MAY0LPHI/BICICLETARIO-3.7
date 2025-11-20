import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';

export class BicicletasManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            addBikeModal: document.getElementById('add-bike-modal'),
            addBikeForm: document.getElementById('add-bike-form'),
            cancelAddBikeBtn: document.getElementById('cancel-add-bike'),
            bikeClientIdInput: document.getElementById('bike-client-id'),
            editBikeModal: document.getElementById('edit-bike-modal'),
            editBikeForm: document.getElementById('edit-bike-form'),
            editBikeClientId: document.getElementById('edit-bike-client-id'),
            editBikeId: document.getElementById('edit-bike-id'),
            editBikeModelo: document.getElementById('edit-bike-modelo'),
            editBikeMarca: document.getElementById('edit-bike-marca'),
            editBikeCor: document.getElementById('edit-bike-cor'),
            cancelEditBike: document.getElementById('cancel-edit-bike'),
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const bikeModelo = document.getElementById('bike-modelo');
        const bikeMarca = document.getElementById('bike-marca');
        const bikeCor = document.getElementById('bike-cor');
        
        this.elements.addBikeForm.addEventListener('submit', this.handleAddBike.bind(this));
        this.elements.cancelAddBikeBtn.addEventListener('click', () => this.app.toggleModal('add-bike-modal', false));
        
        if (bikeModelo) {
            bikeModelo.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        if (bikeMarca) {
            bikeMarca.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        if (bikeCor) {
            bikeCor.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
        
        this.elements.editBikeForm.addEventListener('submit', this.handleEditBike.bind(this));
        this.elements.cancelEditBike.addEventListener('click', () => this.app.toggleModal('edit-bike-modal', false));
        
        this.elements.editBikeModelo.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.editBikeMarca.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.editBikeCor.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    handleAddBike(e) {
        e.preventDefault();
        
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const clientId = this.elements.bikeClientIdInput.value;
        const modelo = document.getElementById('bike-modelo').value;
        const marca = document.getElementById('bike-marca').value;
        const cor = document.getElementById('bike-cor').value;

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            const newBike = { id: Utils.generateUUID(), modelo, marca, cor };
            client.bicicletas.push(newBike);
            Storage.saveClients(this.app.data.clients);
            this.renderClientDetails();
            this.app.toggleModal('add-bike-modal', false);
        }
    }

    openAddBikeModal(clientId) {
        this.elements.addBikeForm.reset();
        this.elements.bikeClientIdInput.value = clientId;
        this.app.toggleModal('add-bike-modal', true);
    }

    renderClientDetails() {
        if (!this.app.data.selectedClientId) {
            this.elements.clientDetailsSection.classList.add('hidden');
            this.elements.clientDetailsPlaceholder.classList.remove('hidden');
            return;
        }
        
        const client = this.app.data.clients.find(c => c.id === this.app.data.selectedClientId);
        if (!client) return;

        this.elements.clientDetailsPlaceholder.classList.add('hidden');
        this.elements.clientDetailsSection.classList.remove('hidden');

        const bikesHTML = client.bicicletas.length > 0 ? client.bicicletas.map(bike => `
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 dark:bg-slate-700/40 dark:border-slate-700">
               <div class="flex justify-between items-start">
                    <div class="flex items-start gap-2 flex-1">
                        <div>
                            <p class="font-semibold text-slate-800 dark:text-slate-100">${bike.modelo} <span class="font-normal text-slate-600 dark:text-slate-300">(${bike.marca})</span></p>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Cor: ${bike.cor}</p>
                        </div>
                        <button class="edit-bike-btn text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-bike-id="${bike.id}" title="Editar bicicleta">
                            <i data-lucide="pencil" class="h-4 w-4"></i>
                        </button>
                    </div>
                    <button class="add-registro-btn flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600" data-bike-id="${bike.id}">
                        <i data-lucide="log-in" class="h-4 w-4 mr-1"></i>
                        Registrar Entrada
                    </button>
               </div>
               <div class="mt-4">
                    <h4 class="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Histórico de Movimentação</h4>
                    ${this.app.registrosManager.renderRegistrosTable(bike.id)}
               </div>
            </div>
        `).join('') : '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma bicicleta cadastrada.</p>';

        this.elements.clientDetailsSection.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-start gap-3">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">${client.nome.replace(/^"|"$/g, '')}</h3>
                        <p class="text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}${client.telefone ? ' &bull; ' + Utils.formatTelefone(client.telefone) : ''}</p>
                    </div>
                    <button id="edit-client-btn" class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Editar dados do cliente">
                        <i data-lucide="pencil" class="h-5 w-5"></i>
                    </button>
                </div>
                <button id="add-bike-to-client-btn" class="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
                    <i data-lucide="plus" class="h-4 w-4 mr-1"></i>
                    Adicionar Bicicleta
                </button>
            </div>
            <div class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                ${bikesHTML}
            </div>
        `;

        lucide.createIcons();
        
        document.getElementById('add-bike-to-client-btn').addEventListener('click', () => this.openAddBikeModal(client.id));
        document.getElementById('edit-client-btn').addEventListener('click', () => this.app.clientesManager.openEditClientModal(client.id));
        this.elements.clientDetailsSection.querySelectorAll('.add-registro-btn').forEach(btn => {
            btn.addEventListener('click', () => this.app.registrosManager.openAddRegistroModal(client.id, btn.dataset.bikeId));
        });
        this.elements.clientDetailsSection.querySelectorAll('.edit-bike-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openEditBikeModal(client.id, btn.dataset.bikeId));
        });
    }

    openEditBikeModal(clientId, bikeId) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bike = client.bicicletas.find(b => b.id === bikeId);
        if (!bike) return;

        this.elements.editBikeClientId.value = clientId;
        this.elements.editBikeId.value = bikeId;
        this.elements.editBikeModelo.value = bike.modelo;
        this.elements.editBikeMarca.value = bike.marca;
        this.elements.editBikeCor.value = bike.cor;

        this.app.toggleModal('edit-bike-modal', true);
    }

    handleEditBike(e) {
        e.preventDefault();

        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const clientId = this.elements.editBikeClientId.value;
        const bikeId = this.elements.editBikeId.value;
        const modelo = this.elements.editBikeModelo.value;
        const marca = this.elements.editBikeMarca.value;
        const cor = this.elements.editBikeCor.value;

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bike = client.bicicletas.find(b => b.id === bikeId);
        if (!bike) return;

        bike.modelo = modelo;
        bike.marca = marca;
        bike.cor = cor;

        Storage.saveClients(this.app.data.clients);
        this.renderClientDetails();
        this.app.toggleModal('edit-bike-modal', false);
    }
}
