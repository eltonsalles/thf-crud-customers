import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  ThfTableColumn,
  ThfPageFilter,
  ThfModalComponent,
  ThfModalAction,
  ThfComboOption,
  ThfRadioGroupOption,
  ThfCheckboxGroupOption,
  ThfDisclaimerGroup,
  ThfDisclaimer,
  ThfPageAction,
  ThfTableAction,
  ThfNotificationService,
  ThfTableComponent
} from '@totvs/thf-ui';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit, OnDestroy {

  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';

  private customerSub: Subscription;
  private customerRemoveSub: Subscription;
  private customersRemoveSub: Subscription;

  public customers: Array<any> = [];

  public loading: boolean = true;
  public hasNext: boolean = false;
  private page: number = 1;
  private searchTerm: string = '';
  private searchFilters: any;

  // Configuração das colunas da tabela
  public readonly columns: Array<ThfTableColumn> = [
    { property: 'name', label: 'Nome' },
    { property: 'nickname', label: 'Apelido' },
    { property: 'email', label: 'E-mail', type: 'link', action: this.sendEmail.bind(this) },
    { property: 'birthdate', label: 'Nascimento', type: 'date', format: 'dd/MM/yyyy', width: '100px' },
    { property: 'genre', label: 'Gênero', type: 'subtitle', width: '80px', subtitles: [
        { value: 'Female', color: 'color-05', content: 'F', label: 'Feminino' },
        { value: 'Male', color: 'color-02', content: 'M', label: 'Masculino' },
        { value: 'Other', color: 'color-08', content: 'O', label: 'Outros' },
      ]},
    { property: 'city', label: 'Cidade' },
    { property: 'status', type: 'label', labels: [
        { value: 'Active', color: 'success', label: 'Ativo' },
        { value: 'Inactive', color: 'danger', label: 'Inativo' }
      ]}
  ];

  // Lista das cidades
  public readonly cityOptions: Array<ThfComboOption> = [
    { label: 'Araquari', value: 'Araquari' },
    { label: 'Belém', value: 'Belém' },
    { label: 'Campinas', value: 'Campinas' },
    { label: 'Curitiba', value: 'Curitiba' },
    { label: 'Joinville', value: 'Joinville' },
    { label: 'Osasco', value: 'Osasco' },
    { label: 'Rio de Janeiro', value: 'Rio de Janeiro' },
    { label: 'São Bento', value: 'São Bento' },
    { label: 'São Francisco', value: 'São Francisco' },
    { label: 'São Paulo', value: 'São Paulo' }
  ];

  // Lista dos gêneros
  public readonly genreOptions: Array<ThfRadioGroupOption> = [
    { label: 'Feminino', value: 'Female' },
    { label: 'Masculino', value: 'Male' },
    { label: 'Outros', value: 'Other' }
  ];

  // Lista de status
  public readonly statusOptions: Array<ThfCheckboxGroupOption> = [
    { label: 'Ativo', value: 'Active' },
    { label: 'Inativo', value: 'Inactive' }
  ];

  // Configuração do filtro
  public readonly filter: ThfPageFilter = {
    action: this.onActionSearch.bind(this), // Filtro
    advancedAction: this.openAdvancedFilter.bind(this), // Filtro avançado
    ngModel: 'searchTerm',
    placeholder: 'Pesquisar por...'
  };

  // Configuração do método pesquisar (Do filtro avançado)
  public readonly advancedFilterPrimaryAction: ThfModalAction = {
    action: this.onConfirmAdvancedFilter.bind(this),
    label: 'Pesquisar'
  };

  // Configuração do método cancelar (Do filtro avançado)
  public readonly advancedFilterSecondaryAction: ThfModalAction = {
    action: () => this.advancedFilter.close(),
    label: 'Cancelar'
  };

  // Configuração do disclaimer (A exibição dos filtros aplicados)
  public readonly disclaimerGroup: ThfDisclaimerGroup = {
    change: this.onChangeDisclaimerGroup.bind(this),
    title: 'Filtros aplicados em nossa pesquisa',
    disclaimers: [],
  };

  public name: string;
  public city: string;
  public genre: string;
  public status: Array<string> = [];

  // Configuração das ações de cadastrar e remover todos os clientes da thf-page-list
  public readonly actions: Array<ThfPageAction> = [
    { action: this.onNewCustomer.bind(this), label: 'Cadastrar', icon: 'thf-icon-user-add' },
    { action: this.onRemoveCustomers.bind(this), label: 'Remover clientes' }
  ];

  // Configurações das ações na tabela (Visulizar, editar e remover)
  public readonly tableActions: Array<ThfTableAction> = [
    { action: this.onViewCustomer.bind(this), label: 'Visualisar' },
    { action: this.onEditCustomer.bind(this), disabled: this.canEditCustomer.bind(this), label: 'Editar' },
    { action: this.onRemoveCustomer.bind(this), label: 'Remover', type: 'danger', separator: true }
  ];

  @ViewChild('advancedFilter') advancedFilter: ThfModalComponent;
  @ViewChild('table') table: ThfTableComponent;

  constructor(private httpClient: HttpClient, private router: Router, private thfNotification: ThfNotificationService) { }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.customerSub.unsubscribe();

    if (this.customerRemoveSub) {
      this.customerRemoveSub.unsubscribe();
    }

    if (this.customersRemoveSub) {
      this.customersRemoveSub.unsubscribe();
    }
  }

  // "Envio de e-mail"
  private sendEmail(email, customer) {
    const body = `Olá ${customer.name}, gostariamos de agradecer seu contato.`;
    const subject = 'Contato';

    window.open(`malito:${email}?subject=${subject}&body=${body}`, '_self');
  }

  // Carregar os dados
  private loadData(params: { page?: number, search?: string } = { }) {
    this.loading = true;

    this.customerSub = this.httpClient.get(this.url, { params: <any>params })
      .subscribe((response: { hasNext: boolean, items: Array<any> }) => {
        this.customers = !params.page || params.page === 1
          ? response.items
          : [...this.customers, ...response.items];
        this.hasNext = response.hasNext;
        this.page++;
        this.loading = false;
      });
  }

  // Pesquisa rápida (Lembrando que sempre que ocorrer uma alteração do disclaimer é disparado uma ação,
  // que no caso é filtrar os dados conforme a pesquisa realizada)
  private onActionSearch() {
    this.disclaimerGroup.disclaimers = [{
      label: `Pesquisa rápida: ${this.searchTerm}`,
      property: 'search',
      value: this.searchTerm
    }];
  }

  // Carregar mais dados
  public showMore() {
    let params: any = {
      page: ++this.page,
    };

    if (this.searchTerm) {
      params.searchTerm = this.searchTerm;
    } else {
      params = { ...params, ...this.searchFilters };
    }

    this.loadData(params);
  }

  // Abrir o modal para a pesquisa avançada
  private openAdvancedFilter() {
    this.advancedFilter.open();
  }

  // Ação disparada quando clicado em pesquisar no modal de pesquisa avançada (Nesse caso ocorre uma atualização dos disclaimers)
  private onConfirmAdvancedFilter() {
    const addDisclaimers = (property: string, value: string, label: string) =>
      value && this.disclaimerGroup.disclaimers.push({ property, value, label: `${label}: ${value}` });

    this.disclaimerGroup.disclaimers = [];

    addDisclaimers('city', this.city, 'Cidade');
    addDisclaimers('genre', this.genre, 'Gênero');
    addDisclaimers('name', this.name, 'Nome');
    addDisclaimers('status', this.status ? this.status.join(', ') : '', 'Status');

    this.advancedFilter.close();
  }

  // A cada alteração nos disclaimer a lista de clientes é atualizada
  private onChangeDisclaimerGroup(disclaimers: Array<ThfDisclaimer>) {
    this.searchFilters = {};
    this.page = 1;

    disclaimers.forEach(disclaimer => {
      this.searchFilters[disclaimer.property] = disclaimer.value;
    });

    if (!this.searchFilters.search) {
      this.searchTerm = undefined;
    }

    this.loadData(this.searchFilters);
  }

  // Navega para a página de cadastro de cliente
  private onNewCustomer() {
    this.router.navigateByUrl('/customers/new');
  }

  // Navega para página de visualização de cliente
  private onViewCustomer(customer) {
    this.router.navigateByUrl(`/customers/view/${customer.id}`);
  }

  // Navega para a página de edição de cliente
  private onEditCustomer(customer) {
    this.router.navigateByUrl(`/customers/edit/${customer.id}`);
  }

  // Verifica se o botão editar deve ser desabilitado (active = habilitado / inactive = desabilitado)
  private canEditCustomer(customer) {
    return customer.status !== 'Active';
  }

  // Método para remover um cliente
  private onRemoveCustomer(customer) {
    this.customerRemoveSub = this.httpClient.delete(`${this.url}/${customer.id}`)
      .subscribe(() => {
        this.thfNotification.warning('Cadastro do cliente apagado com sucesso');
        this.customers.splice(this.customers.indexOf(customer), 1);
      });
  }

  // Método para remover vários clientes
  private onRemoveCustomers() {
    const selectedCustomers = this.table.getSelectedRows();
    const customersWithId = selectedCustomers.map(customer => ({ id: customer.id }));

    this.customersRemoveSub = this.httpClient.request('delete', this.url, { body: customersWithId })
      .subscribe(() => {
        this.thfNotification.warning('Clientes apagados com sucesso');

        selectedCustomers.forEach(customer => {
          this.customers.splice(this.customers.indexOf(customer), 1);
        });
      });
  }
}
