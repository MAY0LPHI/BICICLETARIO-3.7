import { Storage } from '../shared/storage.js';
import { Utils } from '../shared/utils.js';
import { Modals } from '../shared/modals.js';
import { Auth } from '../shared/auth.js';

export class ConfiguracaoManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            themeRadios: document.querySelectorAll('input[name="theme"]'),
            globalSearch: document.getElementById('global-search'),
            globalSearchResults: document.getElementById('global-search-results'),
            importFile: document.getElementById('import-file'),
            importBtn: document.getElementById('import-btn'),
            importStatus: document.getElementById('import-status'),
            exportExcelBtn: document.getElementById('export-excel-btn'),
            exportCsvBtn: document.getElementById('export-csv-config-btn'),
            exportSystemExcelBtn: document.getElementById('export-system-excel-btn'),
            exportSystemCsvBtn: document.getElementById('export-system-csv-btn'),
            importSystemFile: document.getElementById('import-system-file'),
            importSystemBtn: document.getElementById('import-system-btn'),
            importSystemStatus: document.getElementById('import-system-status'),
            historicoOrganizado: document.getElementById('historico-organizado'),
            historicoSummary: document.getElementById('historico-summary'),
        };
        this.expandedYears = new Set();
        this.expandedMonths = new Set();
        this.init();
    }

    init() {
        this.addEventListeners();
        this.setupSystemThemeListener();
        this.loadThemePreference();
        this.renderHistoricoOrganizado();
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('themePreference') || 'system';
        
        const allRadios = document.querySelectorAll('input[name="theme"]');
        allRadios.forEach(radio => {
            radio.checked = radio.value === savedTheme;
        });
        
        this.updateThemeLabels(savedTheme);
        
        if (savedTheme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(savedTheme);
        }
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            const currentPreference = localStorage.getItem('themePreference');
            if (currentPreference === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    addEventListeners() {
        this.elements.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleThemeChange(e.target.value);
                this.updateThemeLabels(e.target.value);
            });
        });

        this.elements.globalSearch.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.handleGlobalSearch(e.target.value);
        });

        this.elements.importFile.addEventListener('change', (e) => {
            this.elements.importBtn.disabled = !e.target.files.length;
        });

        this.elements.importBtn.addEventListener('click', () => this.handleImport());
        this.elements.exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportToCSV());

        if (this.elements.importSystemFile) {
            this.elements.importSystemFile.addEventListener('change', (e) => {
                this.elements.importSystemBtn.disabled = !e.target.files.length;
            });
        }

        if (this.elements.importSystemBtn) {
            this.elements.importSystemBtn.addEventListener('click', () => this.handleSystemImport());
        }
        
        if (this.elements.exportSystemExcelBtn) {
            this.elements.exportSystemExcelBtn.addEventListener('click', () => this.exportSystemToExcel());
        }
        
        if (this.elements.exportSystemCsvBtn) {
            this.elements.exportSystemCsvBtn.addEventListener('click', () => this.exportSystemToCSV());
        }
    }

    updateThemeLabels(selectedTheme) {
        const labels = document.querySelectorAll('input[name="theme"]').forEach(radio => {
            const label = radio.closest('label');
            if (radio.value === selectedTheme) {
                label.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.remove('border-slate-200', 'dark:border-slate-600');
            } else {
                label.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.add('border-slate-200', 'dark:border-slate-600');
            }
        });
    }

    handleThemeChange(theme) {
        localStorage.setItem('themePreference', theme);
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(theme);
        }
    }

    applyTheme(theme) {
        const htmlElement = document.documentElement;
        const isDark = theme === 'dark';
        
        if (isDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
        
        localStorage.setItem('theme', theme);
    }

    handleGlobalSearch(query) {
        const resultsContainer = this.elements.globalSearchResults;
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Digite para buscar clientes</p>';
            return;
        }

        const searchTerm = query.toLowerCase();
        const numericSearch = query.replace(/\D/g, '');
        
        const results = this.app.data.clients.filter(client => {
            const name = client.nome.toLowerCase();
            const cpf = client.cpf.replace(/\D/g, '');
            const telefone = client.telefone.replace(/\D/g, '');
            
            const matchesName = name.includes(searchTerm);
            const matchesCPF = numericSearch.length > 0 && cpf.includes(numericSearch);
            const matchesTelefone = numericSearch.length > 0 && telefone.includes(numericSearch);
            
            return matchesName || matchesCPF || matchesTelefone;
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum cliente encontrado para "<span class="font-semibold">' + query + '</span>"</p>';
            return;
        }
        
        const resultCountMsg = `<p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">${results.length} cliente(s) encontrado(s)</p>`;

        resultsContainer.innerHTML = resultCountMsg + results.map(client => `
            <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div class="cursor-pointer" data-client-id="${client.id}">
                    <p class="font-semibold text-slate-800 dark:text-slate-100">${client.nome}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatTelefone(client.telefone)}</p>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                    <button class="export-client-pdf-btn flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-text" class="w-3 h-3"></i>
                        Exportar PDF
                    </button>
                    <button class="export-client-excel-btn flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-spreadsheet" class="w-3 h-3"></i>
                        Exportar Excel
                    </button>
                </div>
            </div>
        `).join('');

        resultsContainer.querySelectorAll('[data-client-id]').forEach(el => {
            if (!el.classList.contains('export-client-pdf-btn') && !el.classList.contains('export-client-excel-btn')) {
                el.addEventListener('click', () => {
                    const clientId = el.dataset.clientId;
                    this.app.data.selectedClientId = clientId;
                    this.app.switchTab('clientes');
                    this.app.clientesManager.renderClientDetails(clientId);
                });
            }
        });

        resultsContainer.querySelectorAll('.export-client-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToPDF(clientId);
            });
        });

        resultsContainer.querySelectorAll('.export-client-excel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToExcel(clientId);
            });
        });

        lucide.createIcons();
    }

    async handleImport() {
        try {
            Auth.requirePermission('configuracao', 'importar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const file = this.elements.importFile.files[0];
        if (!file) return;

        const statusEl = this.elements.importStatus;
        statusEl.classList.remove('hidden');
        statusEl.innerHTML = '<p class="text-blue-600 dark:text-blue-400">Importando...</p>';

        try {
            const data = await this.readFile(file);
            const imported = this.processImportData(data);
            
            if (imported > 0) {
                Storage.saveClients(this.app.data.clients);
                this.app.clientesManager.renderClientList();
                statusEl.innerHTML = `<p class="text-green-600 dark:text-green-400">✓ ${imported} cliente(s) importado(s) com sucesso!</p>`;
                this.elements.importFile.value = '';
                this.elements.importBtn.disabled = true;
            } else {
                statusEl.innerHTML = '<p class="text-yellow-600 dark:text-yellow-400">Nenhum cliente válido encontrado no arquivo.</p>';
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            statusEl.innerHTML = `<p class="text-red-600 dark:text-red-400">✗ Erro ao importar: ${error.message}</p>`;
        }

        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }

    sanitizeCsvCell(cell) {
        if (typeof cell !== 'string') return cell;
        
        let sanitized = cell.trim();
        
        if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
            sanitized = sanitized.slice(1, -1);
        }
        
        sanitized = sanitized.replace(/""/g, '"');
        
        return sanitized;
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const isCSV = file.name.endsWith('.csv');

            reader.onload = (e) => {
                try {
                    if (isCSV) {
                        const text = e.target.result;
                        const rows = text.split('\n').map(row => 
                            row.split(',').map(cell => this.sanitizeCsvCell(cell))
                        );
                        resolve(rows);
                    } else {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                        resolve(jsonData);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            
            if (isCSV) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    processImportData(rows) {
        let imported = 0;
        
        rows.forEach((row, index) => {
            if (index === 0 && (row[0]?.toLowerCase().includes('nome') || row[0]?.toLowerCase().includes('name'))) {
                return;
            }

            if (row.length >= 3 && row[0] && row[2]) {
                const nome = String(row[0]).trim();
                const telefoneRaw = String(row[1] || '').trim();
                const telefone = telefoneRaw.replace(/\D/g, '');
                const cpf = String(row[2]).replace(/\D/g, '');

                if (nome && cpf && Utils.validateCPF(cpf)) {
                    const exists = this.app.data.clients.some(c => c.cpf.replace(/\D/g, '') === cpf);
                    
                    if (!exists) {
                        const newClient = {
                            id: Utils.generateUUID(),
                            nome: nome,
                            cpf: cpf,
                            telefone: telefone,
                            bicicletas: []
                        };
                        this.app.data.clients.push(newClient);
                        imported++;
                    }
                }
            }
        });

        return imported;
    }

    exportToExcel() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const data = this.prepareExportData();
        
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");
        
        XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    exportToCSV() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const data = this.prepareExportData();
        
        const csvContent = data.map(row => 
            row.map(cell => {
                const cellStr = String(cell);
                const escaped = cellStr.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        ).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    prepareExportData() {
        const headers = ['Nome', 'Número', 'CPF'];
        const rows = this.app.data.clients.map(client => [
            client.nome,
            client.telefone ? Utils.formatTelefone(client.telefone) : '',
            Utils.formatCPF(client.cpf)
        ]);
        
        return [headers, ...rows];
    }

    getClientRecords(clientId) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return null;

        const clientRecords = this.app.data.registros.filter(r => r.clientId === clientId);
        
        const recordsWithDetails = clientRecords.map(registro => {
            let bikeModel = 'N/A';
            let bikeBrand = 'N/A';
            let bikeColor = 'N/A';

            if (registro.bikeSnapshot) {
                bikeModel = registro.bikeSnapshot.modelo;
                bikeBrand = registro.bikeSnapshot.marca;
                bikeColor = registro.bikeSnapshot.cor;
            } else {
                const bike = client.bicicletas?.find(b => b.id === registro.bikeId);
                if (bike) {
                    bikeModel = bike.modelo;
                    bikeBrand = bike.marca;
                    bikeColor = bike.cor;
                }
            }

            return {
                ...registro,
                clientName: client.nome,
                clientCPF: client.cpf,
                bikeModel: bikeModel,
                bikeBrand: bikeBrand,
                bikeColor: bikeColor
            };
        });

        recordsWithDetails.sort((a, b) => new Date(b.dataHoraEntrada) - new Date(a.dataHoraEntrada));
        
        return {
            client,
            records: recordsWithDetails
        };
    }

    async exportClientRecordsToPDF(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        let yPos = margin;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Relatório de Registros de Acesso', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Informações do Cliente', margin, yPos);
        
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Nome: ${data.client.nome}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`CPF: ${Utils.formatCPF(data.client.cpf)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Telefone: ${Utils.formatTelefone(data.client.telefone)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Total de Registros: ${data.records.length}`, margin + 5, yPos);

        yPos += 12;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Histórico de Registros', margin, yPos);
        
        yPos += 8;

        data.records.forEach((registro, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Registro #${index + 1}`, margin, yPos);
            
            yPos += 6;
            doc.setFont(undefined, 'normal');
            doc.text(`Bicicleta: ${registro.bikeModel} (${registro.bikeBrand} - ${registro.bikeColor})`, margin + 5, yPos);
            
            yPos += 5;
            const entradaDate = new Date(registro.dataHoraEntrada);
            doc.text(`Entrada: ${entradaDate.toLocaleString('pt-BR')}`, margin + 5, yPos);
            
            yPos += 5;
            if (registro.dataHoraSaida) {
                const saidaDate = new Date(registro.dataHoraSaida);
                const statusText = registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal';
                doc.text(`Saída: ${saidaDate.toLocaleString('pt-BR')} (${statusText})`, margin + 5, yPos);
            } else {
                doc.text('Saída: Ainda no estacionamento', margin + 5, yPos);
            }

            yPos += 8;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 2;
        });

        doc.save(`registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    async exportClientRecordsToExcel(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const headers = ['Data/Hora Entrada', 'Data/Hora Saída', 'Status', 'Bicicleta', 'Marca', 'Cor'];
        const rows = data.records.map(registro => {
            const entradaDate = new Date(registro.dataHoraEntrada);
            const saidaDate = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : null;
            const status = !registro.dataHoraSaida ? 'No estacionamento' : 
                          (registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal');
            
            return [
                entradaDate.toLocaleString('pt-BR'),
                saidaDate ? saidaDate.toLocaleString('pt-BR') : '-',
                status,
                registro.bikeModel,
                registro.bikeBrand,
                registro.bikeColor
            ];
        });

        const clientInfo = [
            ['RELATÓRIO DE REGISTROS DE ACESSO'],
            [],
            ['Cliente:', data.client.nome],
            ['CPF:', Utils.formatCPF(data.client.cpf)],
            ['Telefone:', Utils.formatTelefone(data.client.telefone)],
            ['Total de Registros:', data.records.length],
            ['Gerado em:', new Date().toLocaleString('pt-BR')],
            [],
            headers,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(clientInfo);
        
        ws['!cols'] = [
            { wch: 20 },
            { wch: 20 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        
        XLSX.writeFile(wb, `registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async renderHistoricoOrganizado() {
        const summary = await Storage.loadStorageSummary();
        const organized = await Storage.getOrganizedRegistros();
        
        if (!summary || summary.totalRegistros === 0) {
            this.elements.historicoOrganizado.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum registro encontrado</p>';
            this.elements.historicoSummary.innerHTML = '';
            return;
        }

        this.elements.historicoSummary.innerHTML = `
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span class="font-semibold text-slate-700 dark:text-slate-200">Total de Registros: ${summary.totalRegistros}</span>
            </div>
        `;

        const years = Object.keys(organized).sort((a, b) => b - a);
        
        this.elements.historicoOrganizado.innerHTML = years.map(year => {
            const yearData = summary.anos[year];
            const isExpanded = this.expandedYears.has(year);
            
            return `
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div class="folder-header flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-year="${year}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="font-semibold text-slate-800 dark:text-slate-100">${year}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${yearData.totalMeses} ${yearData.totalMeses === 1 ? 'mês' : 'meses'})</span>
                        </div>
                        <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                            ${Object.values(yearData.meses).reduce((sum, m) => sum + m.totalRegistros, 0)} registros
                        </span>
                    </div>
                    <div class="year-content ${isExpanded ? '' : 'hidden'} p-2 space-y-2">
                        ${this.renderMonths(year, organized[year], yearData)}
                    </div>
                </div>
            `;
        }).join('');

        this.attachHistoricoEventListeners();
    }

    renderMonths(year, monthsData, summaryData) {
        const months = Object.keys(monthsData).sort((a, b) => b - a);
        
        return months.map(month => {
            const monthInfo = summaryData.meses[month];
            const isExpanded = this.expandedMonths.has(`${year}-${month}`);
            
            return `
                <div class="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div class="month-header flex items-center justify-between p-2 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" data-year="${year}" data-month="${month}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${monthInfo.nome}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${monthInfo.totalDias} ${monthInfo.totalDias === 1 ? 'dia' : 'dias'})</span>
                        </div>
                        <span class="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                            ${monthInfo.totalRegistros}
                        </span>
                    </div>
                    <div class="month-content ${isExpanded ? '' : 'hidden'} p-2 pl-6 space-y-1">
                        ${this.renderDays(year, month, monthsData[month], monthInfo)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDays(year, month, daysData, monthInfo) {
        const days = Object.keys(daysData).sort((a, b) => b - a);
        
        return days.map(day => {
            const dayCount = monthInfo.dias[day];
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            
            const registrosDay = daysData[day] || [];
            const pernoiteCount = registrosDay.filter(r => r.pernoite === true).length;
            
            return `
                <div class="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 dark:text-slate-400">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                            <line x1="16" x2="16" y1="2" y2="6"/>
                            <line x1="8" x2="8" y1="2" y2="6"/>
                            <line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span class="text-sm text-slate-700 dark:text-slate-200">${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 capitalize">(${dayName})</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
                            ${dayCount} ${dayCount === 1 ? 'registro' : 'registros'}
                        </span>
                        ${pernoiteCount > 0 ? `
                            <span class="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                                </svg>
                                ${pernoiteCount} ${pernoiteCount === 1 ? 'pernoite' : 'pernoites'}
                            </span>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    attachHistoricoEventListeners() {
        document.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const year = e.currentTarget.dataset.year;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedYears.has(year)) {
                    this.expandedYears.delete(year);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedYears.add(year);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });

        document.querySelectorAll('.month-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const year = e.currentTarget.dataset.year;
                const month = e.currentTarget.dataset.month;
                const key = `${year}-${month}`;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedMonths.has(key)) {
                    this.expandedMonths.delete(key);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedMonths.add(key);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });
    }

    exportSystemToExcel() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const systemData = this.prepareSystemExportData();
        const wb = XLSX.utils.book_new();

        if (systemData.clientes && systemData.clientes.length > 0) {
            const clientesWs = XLSX.utils.aoa_to_sheet(systemData.clientes);
            XLSX.utils.book_append_sheet(wb, clientesWs, "Clientes");
        }

        if (systemData.registros && systemData.registros.length > 0) {
            const registrosWs = XLSX.utils.aoa_to_sheet(systemData.registros);
            XLSX.utils.book_append_sheet(wb, registrosWs, "Registros");
        }

        if (systemData.usuarios && systemData.usuarios.length > 0) {
            const usuariosWs = XLSX.utils.aoa_to_sheet(systemData.usuarios);
            XLSX.utils.book_append_sheet(wb, usuariosWs, "Usuarios");
        }

        const fileName = `backup_sistema_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        Modals.alert(`Backup completo exportado com sucesso para ${fileName}`);
    }

    exportSystemToCSV() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const systemData = this.prepareSystemExportData();
        
        const sections = [];
        if (systemData.clientes && systemData.clientes.length > 0) {
            sections.push({ name: 'Clientes', data: systemData.clientes });
        }
        if (systemData.registros && systemData.registros.length > 0) {
            sections.push({ name: 'Registros', data: systemData.registros });
        }
        if (systemData.usuarios && systemData.usuarios.length > 0) {
            sections.push({ name: 'Usuarios', data: systemData.usuarios });
        }

        let csvContent = '';
        sections.forEach((section, index) => {
            if (index > 0) csvContent += '\n\n';
            csvContent += `=== ${section.name} ===\n`;
            csvContent += section.data.map(row => 
                row.map(cell => {
                    const cellStr = String(cell);
                    const escaped = cellStr.replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            ).join('\n');
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const fileName = `backup_sistema_${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Modals.alert(`Backup completo exportado com sucesso para ${fileName}`);
    }

    prepareSystemExportData() {
        const clientesHeaders = ['ID', 'Nome', 'CPF', 'Telefone', 'Bicicletas'];
        const clientesRows = this.app.data.clients.map(client => [
            client.id,
            client.nome,
            client.cpf,
            client.telefone || '',
            client.bicicletas ? JSON.stringify(client.bicicletas) : '[]'
        ]);

        const registrosHeaders = ['ID', 'Cliente ID', 'Bicicleta ID', 'Data Entrada', 'Data Saída', 'Pernoite', 'Acesso Removido', 'Registro Original ID'];
        const registrosRows = this.app.data.registros.map(registro => [
            registro.id,
            registro.clientId,
            registro.bikeId,
            registro.dataHoraEntrada,
            registro.dataHoraSaida || '',
            registro.pernoite ? 'Sim' : 'Não',
            registro.acessoRemovido ? 'Sim' : 'Não',
            registro.registroOriginalId || ''
        ]);

        const usuarios = Auth.getAllUsers();
        const usuariosHeaders = ['ID', 'Username', 'Password', 'Nome', 'Tipo', 'Ativo', 'Permissões'];
        const usuariosRows = usuarios.map(user => [
            user.id,
            user.username,
            user.password,
            user.nome,
            user.tipo,
            user.ativo ? 'Sim' : 'Não',
            JSON.stringify(user.permissoes)
        ]);

        return {
            clientes: [clientesHeaders, ...clientesRows],
            registros: [registrosHeaders, ...registrosRows],
            usuarios: [usuariosHeaders, ...usuariosRows]
        };
    }

    mergeSystemData(importedData) {
        const stats = {
            clientesNovos: 0,
            clientesMesclados: 0,
            bicicletasAdicionadas: 0,
            registrosNovos: 0,
            usuariosNovos: 0
        };

        const existingClients = this.app.data.clients;
        const existingRegistros = this.app.data.registros;
        const existingUsuarios = Auth.getAllUsers();

        const clientesByCPF = new Map();
        existingClients.forEach(client => {
            const cpfClean = client.cpf.replace(/\D/g, '');
            clientesByCPF.set(cpfClean, client);
        });

        importedData.clients.forEach(importedClient => {
            const cpfClean = importedClient.cpf.replace(/\D/g, '');
            const existingClient = clientesByCPF.get(cpfClean);

            if (existingClient) {
                const existingBikesIds = new Set(existingClient.bicicletas.map(b => b.id));
                importedClient.bicicletas.forEach(bike => {
                    if (!existingBikesIds.has(bike.id)) {
                        existingClient.bicicletas.push(bike);
                        existingBikesIds.add(bike.id);
                        stats.bicicletasAdicionadas++;
                    }
                });
                stats.clientesMesclados++;
            } else {
                existingClients.push(importedClient);
                clientesByCPF.set(cpfClean, importedClient);
                stats.clientesNovos++;
                stats.bicicletasAdicionadas += importedClient.bicicletas.length;
            }
        });

        const existingRegistrosIds = new Set(existingRegistros.map(r => r.id));
        importedData.registros.forEach(registro => {
            if (!existingRegistrosIds.has(registro.id)) {
                existingRegistros.push(registro);
                existingRegistrosIds.add(registro.id);
                stats.registrosNovos++;
            }
        });

        const existingUsuariosUsernames = new Set(existingUsuarios.map(u => u.username));
        const usuariosToAdd = [];
        importedData.usuarios.forEach(usuario => {
            if (!existingUsuariosUsernames.has(usuario.username)) {
                usuariosToAdd.push(usuario);
                existingUsuariosUsernames.add(usuario.username);
                stats.usuariosNovos++;
            }
        });
        
        const mergedUsuarios = [...existingUsuarios, ...usuariosToAdd];
        
        return {
            clients: existingClients,
            registros: existingRegistros,
            usuarios: mergedUsuarios,
            stats: stats
        };
    }

    async handleSystemImport() {
        try {
            Auth.requirePermission('configuracao', 'importar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const file = this.elements.importSystemFile.files[0];
        if (!file) return;

        const confirmed = await Modals.showConfirm(
            'Esta operação irá MESCLAR os dados do arquivo com os dados existentes no sistema. Clientes duplicados (mesmo CPF) terão suas bicicletas mescladas, registros e usuários duplicados (mesmo ID/username) serão ignorados. Deseja continuar?'
        );
        
        if (!confirmed) return;

        try {
            this.showImportSystemStatus('Importando dados...', 'info');
            
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let importedData;

            if (fileExtension === 'csv') {
                importedData = await this.processSystemCSVImport(file);
            } else {
                importedData = await this.processSystemExcelImport(file);
            }

            const mergedData = this.mergeSystemData(importedData);

            await Storage.saveClients(mergedData.clients);
            await Storage.saveRegistros(mergedData.registros);
            Auth.saveUsers(mergedData.usuarios);

            this.app.data.clients = mergedData.clients;
            this.app.data.registros = mergedData.registros;

            this.showImportSystemStatus(`✅ Backup importado com sucesso! ${mergedData.stats.clientesNovos} clientes novos, ${mergedData.stats.clientesMesclados} mesclados, ${mergedData.stats.bicicletasAdicionadas} bicicletas adicionadas, ${mergedData.stats.registrosNovos} registros novos, ${mergedData.stats.usuariosNovos} usuários novos.`, 'success');
            
            this.app.clientesManager.renderClientList();
            
            setTimeout(() => {
                Modals.alert('Dados importados com sucesso! A página será recarregada.');
                setTimeout(() => window.location.reload(), 1500);
            }, 1000);

        } catch (error) {
            console.error('Erro ao importar backup:', error);
            this.showImportSystemStatus(`❌ Erro ao importar: ${error.message}`, 'error');
        }
    }

    async processSystemExcelImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const clientesSheet = workbook.Sheets['Clientes'];
                    const registrosSheet = workbook.Sheets['Registros'];
                    const usuariosSheet = workbook.Sheets['Usuarios'];
                    const bicicletasSheet = workbook.Sheets['Bicicletas'];

                    if (!clientesSheet || !registrosSheet || !usuariosSheet) {
                        throw new Error('Arquivo inválido. Certifique-se de que contém as abas: Clientes, Registros e Usuarios');
                    }

                    const clientesData = XLSX.utils.sheet_to_json(clientesSheet, { header: 1 });
                    const registrosData = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
                    const usuariosData = XLSX.utils.sheet_to_json(usuariosSheet, { header: 1 });
                    const bicicletasData = bicicletasSheet ? XLSX.utils.sheet_to_json(bicicletasSheet, { header: 1 }) : [];

                    const clients = this.parseClientesData(clientesData, bicicletasData);
                    const registros = this.parseRegistrosData(registrosData);
                    const usuarios = this.parseUsuariosData(usuariosData);

                    resolve({
                        clients,
                        registros,
                        usuarios
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    async processSystemCSVImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const sections = text.split(/\n\n=== /);
                    
                    let clientesData = [];
                    let bicicletasData = [];
                    let registrosData = [];
                    let usuariosData = [];
                    
                    sections.forEach(section => {
                        const lines = section.split('\n');
                        const sectionName = lines[0].replace('=== ', '').replace(' ===', '').trim();
                        
                        const rows = lines.slice(1).filter(line => line.trim()).map(line => {
                            return line.split(',').map(cell => {
                                let cleaned = cell.trim();
                                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                                    cleaned = cleaned.slice(1, -1);
                                }
                                cleaned = cleaned.replace(/""/g, '"');
                                return cleaned;
                            });
                        });
                        
                        if (sectionName === 'Clientes') {
                            clientesData = rows;
                        } else if (sectionName === 'Bicicletas') {
                            bicicletasData = rows;
                        } else if (sectionName === 'Registros') {
                            registrosData = rows;
                        } else if (sectionName === 'Usuarios') {
                            usuariosData = rows;
                        }
                    });
                    
                    if (clientesData.length === 0) {
                        throw new Error('Arquivo CSV inválido. Certifique-se de que contém dados de Clientes');
                    }
                    
                    const clients = this.parseClientesData(clientesData, bicicletasData);
                    const registros = this.parseRegistrosData(registrosData);
                    const usuarios = this.parseUsuariosData(usuariosData);
                    
                    resolve({
                        clients,
                        registros,
                        usuarios
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
            reader.readAsText(file);
        });
    }

    parseClientesData(clientesData, bicicletasData) {
        const clientesMap = new Map();
        
        for (let i = 1; i < clientesData.length; i++) {
            const row = clientesData[i];
            if (!row[0]) continue;

            let bicicletas = [];
            
            // Verifica se as bicicletas estão no formato JSON (nova estrutura de exportação)
            if (row[4]) {
                try {
                    bicicletas = JSON.parse(row[4]);
                } catch (e) {
                    bicicletas = [];
                }
            }

            clientesMap.set(row[0], {
                id: row[0],
                nome: row[1],
                cpf: row[2],
                telefone: row[3] || '',
                bicicletas: bicicletas
            });
        }

        // Se houver aba de bicicletas separada (formato antigo), processa também
        if (bicicletasData && bicicletasData.length > 1) {
            for (let i = 1; i < bicicletasData.length; i++) {
                const row = bicicletasData[i];
                if (!row[0]) continue;

                const clienteId = row[1];
                const client = clientesMap.get(clienteId);
                
                if (client) {
                    client.bicicletas.push({
                        id: row[0],
                        modelo: row[2],
                        marca: row[3],
                        cor: row[4]
                    });
                }
            }
        }

        return Array.from(clientesMap.values());
    }

    parseRegistrosData(registrosData) {
        const registros = [];
        
        for (let i = 1; i < registrosData.length; i++) {
            const row = registrosData[i];
            if (!row[0]) continue;

            registros.push({
                id: row[0],
                clientId: row[1],
                bikeId: row[2],
                dataHoraEntrada: row[3],
                dataHoraSaida: row[4] || null,
                pernoite: row[5] === 'Sim',
                acessoRemovido: row[6] === 'Sim',
                registroOriginalId: row[7] || null
            });
        }

        return registros;
    }

    parseUsuariosData(usuariosData) {
        const usuarios = [];
        
        for (let i = 1; i < usuariosData.length; i++) {
            const row = usuariosData[i];
            if (!row[0]) continue;

            usuarios.push({
                id: row[0],
                username: row[1],
                password: row[2],
                nome: row[3],
                tipo: row[4],
                ativo: row[5] === 'Sim',
                permissoes: JSON.parse(row[6])
            });
        }

        return usuarios;
    }

    showImportSystemStatus(message, type) {
        const statusEl = this.elements.importSystemStatus;
        if (!statusEl) return;

        statusEl.textContent = message;
        statusEl.className = `text-sm ${
            type === 'success' ? 'text-green-600 dark:text-green-400' :
            type === 'error' ? 'text-red-600 dark:text-red-400' :
            'text-blue-600 dark:text-blue-400'
        }`;
        statusEl.classList.remove('hidden');
    }

    applyPermissionsToUI() {
        const canExport = Auth.hasPermission('configuracao', 'exportar');
        const canImport = Auth.hasPermission('configuracao', 'importar');

        if (!canExport) {
            if (this.elements.exportExcelBtn) this.elements.exportExcelBtn.style.display = 'none';
            if (this.elements.exportCsvBtn) this.elements.exportCsvBtn.style.display = 'none';
            if (this.elements.exportSystemExcelBtn) this.elements.exportSystemExcelBtn.style.display = 'none';
            if (this.elements.exportSystemCsvBtn) this.elements.exportSystemCsvBtn.style.display = 'none';
        }

        if (!canImport) {
            if (this.elements.importFile) this.elements.importFile.style.display = 'none';
            if (this.elements.importBtn) this.elements.importBtn.style.display = 'none';
            if (this.elements.importSystemFile) this.elements.importSystemFile.style.display = 'none';
            if (this.elements.importSystemBtn) this.elements.importSystemBtn.style.display = 'none';
            
            const importSection = document.querySelector('#configuracao-tab-content .bg-white.rounded-lg.shadow-sm.p-6:nth-of-type(2)');
            if (importSection) importSection.style.display = 'none';
            
            const systemImportSection = document.querySelector('#configuracao-tab-content .bg-white.rounded-lg.shadow-sm.p-6:nth-of-type(3)');
            if (systemImportSection) systemImportSection.style.display = 'none';
        }
    }
}
