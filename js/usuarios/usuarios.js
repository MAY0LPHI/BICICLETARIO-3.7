/**
 * Módulo de Gerenciamento de Usuários
 * Permite ao administrador gerenciar funcionários e suas permissões
 */

import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';

export class Usuarios {
    static init() {
        this.renderUserList();
        this.setupEventListeners();
    }

    static setupEventListeners() {
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }
    }

    static renderUserList() {
        const container = document.getElementById('users-list');
        if (!container) return;

        const users = Auth.getAllUsers();
        const currentSession = Auth.getCurrentSession();

        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>Nenhum usuário cadastrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full ${user.tipo === 'dono' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900'} flex items-center justify-center">
                                    <i data-lucide="${user.tipo === 'dono' ? 'crown' : user.tipo === 'admin' ? 'shield' : 'user'}" class="w-5 h-5 ${user.tipo === 'dono' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}"></i>
                                </div>
                            </div>
                            <div>
                                <h3 class="font-semibold text-slate-800 dark:text-slate-200">${user.nome}</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">@${user.username}</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            user.tipo === 'dono' 
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                : user.tipo === 'admin' 
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }">
                            ${user.tipo === 'dono' ? 'Dono' : user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                        </span>
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            user.ativo 
                                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        }">
                            ${user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Clientes</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.clientes)}
                        </p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Registros</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.registros)}
                        </p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Configuração</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.configuracao)}
                        </p>
                    </div>
                </div>

                <div class="mt-4 flex space-x-2">
                    <button onclick="Usuarios.editUser('${user.id}')" class="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <i data-lucide="edit" class="w-4 h-4 inline mr-1"></i>
                        Editar
                    </button>
                    <button onclick="Usuarios.toggleUserStatus('${user.id}')" class="flex-1 px-3 py-2 text-sm ${
                        user.ativo 
                            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50' 
                            : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                    } rounded-lg transition-colors">
                        <i data-lucide="${user.ativo ? 'user-x' : 'user-check'}" class="w-4 h-4 inline mr-1"></i>
                        ${user.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    ${user.id !== currentSession?.userId ? `
                        <button onclick="Usuarios.deleteUser('${user.id}')" class="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    static formatPermissions(permissoes) {
        const active = Object.entries(permissoes).filter(([key, value]) => value === true).length;
        const total = Object.keys(permissoes).length;
        return `${active}/${total} permissões`;
    }

    static showAddUserModal() {
        const modalContent = `
            <form id="user-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome Completo</label>
                    <input type="text" id="user-nome" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome de Usuário</label>
                    <input type="text" id="user-username" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Senha</label>
                    <input type="password" id="user-password" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Tipo de Usuário</label>
                    <select id="user-tipo" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                        <option value="funcionario">Funcionário</option>
                        <option value="admin">Administrador</option>
                        <option value="dono">Dono</option>
                    </select>
                </div>
                
                <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 class="font-medium text-slate-700 dark:text-slate-300 mb-3">Permissões</h4>
                    
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Clientes</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="perm-clientes-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-clientes-ver" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-clientes-adicionar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Adicionar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-clientes-adicionar" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-clientes-editar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Editar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-clientes-editar">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-clientes-excluir" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Excluir</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-clientes-excluir">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Registros</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="perm-registros-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-registros-ver" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-registros-adicionar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Adicionar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-registros-adicionar" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-registros-editar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Editar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-registros-editar">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-registros-excluir" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Excluir</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-registros-excluir">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Configuração</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="perm-configuracao-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-configuracao-ver">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-configuracao-exportar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Exportar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-configuracao-exportar">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-configuracao-importar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Importar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-configuracao-importar">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="perm-configuracao-gerenciarUsuarios" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Gerenciar Usuários</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="perm-configuracao-gerenciarUsuarios">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Adicionar Usuário
                    </button>
                    <button type="button" onclick="Modals.close()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        Modals.show('Adicionar Usuário', modalContent);

        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });
    }

    static handleAddUser() {
        const userData = {
            nome: document.getElementById('user-nome').value,
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            tipo: document.getElementById('user-tipo').value,
            permissoes: {
                clientes: {
                    ver: document.getElementById('perm-clientes-ver').checked,
                    adicionar: document.getElementById('perm-clientes-adicionar').checked,
                    editar: document.getElementById('perm-clientes-editar').checked,
                    excluir: document.getElementById('perm-clientes-excluir').checked
                },
                registros: {
                    ver: document.getElementById('perm-registros-ver').checked,
                    adicionar: document.getElementById('perm-registros-adicionar').checked,
                    editar: document.getElementById('perm-registros-editar').checked,
                    excluir: document.getElementById('perm-registros-excluir').checked
                },
                configuracao: {
                    ver: document.getElementById('perm-configuracao-ver').checked,
                    exportar: document.getElementById('perm-configuracao-exportar').checked,
                    importar: document.getElementById('perm-configuracao-importar').checked,
                    gerenciarUsuarios: document.getElementById('perm-configuracao-gerenciarUsuarios').checked
                }
            }
        };

        try {
            const result = Auth.addUser(userData);
            if (result.success) {
                Modals.close();
                this.renderUserList();
                Modals.alert('Usuário adicionado com sucesso!');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static editUser(userId) {
        const user = Auth.getUserById(userId);
        if (!user) return;

        const modalContent = `
            <form id="edit-user-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome Completo</label>
                    <input type="text" id="edit-user-nome" value="${user.nome}" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome de Usuário</label>
                    <input type="text" id="edit-user-username" value="${user.username}" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nova Senha (deixe em branco para manter)</label>
                    <input type="password" id="edit-user-password" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Tipo de Usuário</label>
                    <select id="edit-user-tipo" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                        <option value="funcionario" ${user.tipo === 'funcionario' ? 'selected' : ''}>Funcionário</option>
                        <option value="admin" ${user.tipo === 'admin' ? 'selected' : ''}>Administrador</option>
                        <option value="dono" ${user.tipo === 'dono' ? 'selected' : ''}>Dono</option>
                    </select>
                </div>
                
                <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 class="font-medium text-slate-700 dark:text-slate-300 mb-3">Permissões</h4>
                    
                    <div class="space-y-3">
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Clientes</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-clientes-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-clientes-ver" ${user.permissoes.clientes.ver ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-clientes-adicionar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Adicionar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-clientes-adicionar" ${user.permissoes.clientes.adicionar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-clientes-editar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Editar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-clientes-editar" ${user.permissoes.clientes.editar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-clientes-excluir" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Excluir</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-clientes-excluir" ${user.permissoes.clientes.excluir ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Registros</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-registros-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-registros-ver" ${user.permissoes.registros.ver ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-registros-adicionar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Adicionar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-registros-adicionar" ${user.permissoes.registros.adicionar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-registros-editar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Editar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-registros-editar" ${user.permissoes.registros.editar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-registros-excluir" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Excluir</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-registros-excluir" ${user.permissoes.registros.excluir ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <p class="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Configuração</p>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-configuracao-ver" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Ver</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-configuracao-ver" ${user.permissoes.configuracao.ver ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-configuracao-exportar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Exportar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-configuracao-exportar" ${user.permissoes.configuracao.exportar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-configuracao-importar" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Importar</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-configuracao-importar" ${user.permissoes.configuracao.importar ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="flex items-center justify-between">
                                    <label for="edit-perm-configuracao-gerenciarUsuarios" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">Gerenciar Usuários</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="edit-perm-configuracao-gerenciarUsuarios" ${user.permissoes.configuracao.gerenciarUsuarios ? 'checked' : ''}>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Salvar Alterações
                    </button>
                    <button type="button" onclick="Modals.close()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        Modals.show('Editar Usuário', modalContent);

        document.getElementById('edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditUser(userId);
        });
    }

    static handleEditUser(userId) {
        const userData = {
            nome: document.getElementById('edit-user-nome').value,
            username: document.getElementById('edit-user-username').value,
            tipo: document.getElementById('edit-user-tipo').value,
            permissoes: {
                clientes: {
                    ver: document.getElementById('edit-perm-clientes-ver').checked,
                    adicionar: document.getElementById('edit-perm-clientes-adicionar').checked,
                    editar: document.getElementById('edit-perm-clientes-editar').checked,
                    excluir: document.getElementById('edit-perm-clientes-excluir').checked
                },
                registros: {
                    ver: document.getElementById('edit-perm-registros-ver').checked,
                    adicionar: document.getElementById('edit-perm-registros-adicionar').checked,
                    editar: document.getElementById('edit-perm-registros-editar').checked,
                    excluir: document.getElementById('edit-perm-registros-excluir').checked
                },
                configuracao: {
                    ver: document.getElementById('edit-perm-configuracao-ver').checked,
                    exportar: document.getElementById('edit-perm-configuracao-exportar').checked,
                    importar: document.getElementById('edit-perm-configuracao-importar').checked,
                    gerenciarUsuarios: document.getElementById('edit-perm-configuracao-gerenciarUsuarios').checked
                }
            }
        };

        const newPassword = document.getElementById('edit-user-password').value;
        if (newPassword) {
            userData.password = newPassword;
        }

        try {
            const result = Auth.updateUser(userId, userData);
            if (result.success) {
                Modals.close();
                this.renderUserList();
                Modals.alert('Salvo com sucesso', 'Sucesso');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static async deleteUser(userId) {
        const confirmed = await Modals.showConfirm('Tem certeza que deseja excluir este usuário?');
        if (!confirmed) return;

        try {
            const result = Auth.deleteUser(userId);
            if (result.success) {
                this.renderUserList();
                Modals.alert('Usuário excluído com sucesso!');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static async toggleUserStatus(userId) {
        const user = Auth.getUserById(userId);
        const action = user.ativo ? 'desativar' : 'ativar';
        const confirmed = await Modals.showConfirm(`Tem certeza que deseja ${action} este usuário?`);
        if (!confirmed) return;

        try {
            const result = Auth.toggleUserStatus(userId);
            if (result.success) {
                this.renderUserList();
                Modals.alert(`Usuário ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso!`);
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }
}

window.Usuarios = Usuarios;
