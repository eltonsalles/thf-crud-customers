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
  ThfTableAction } from '@totvs/thf-ui';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit, OnDestroy {

  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';
  private customerSub: Subscription;
  private customers: Array<any> = [];
  private readonly columns: Array<ThfTableColumn> = [
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
  private loading: boolean = true;
  private hasNext: boolean = false;
  private page: number = 1;
  private searchTerm: string = '';
  private readonly filter: ThfPageFilter = {
    action: this.onActionSearch.bind(this),
    advancedAction: this.openAdvancedFilter.bind(this),
    ngModel: 'searchTerm',
    placeholder: 'Pesquisar por...'
  };
  private searchFilters: any;

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

  public readonly genreOptions: Array<ThfRadioGroupOption> = [
    { label: 'Feminino', value: 'Female' },
    { label: 'Masculino', value: 'Male' },
    { label: 'Outros', value: 'Other' }
  ];

  public readonly statusOptions: Array<ThfCheckboxGroupOption> = [
    { label: 'Ativo', value: 'Active' },
    { label: 'Inativo', value: 'Inactive' }
  ];

  public city: string;
  public genre: string;
  public name: string;
  public status: Array<string> = [];

  public readonly advancedFilterPrimaryAction: ThfModalAction = {
    action: this.onConfirmAdvancedFilter.bind(this),
    label: 'Pesquisar'
  };

  public readonly advancedFilterSecondaryAction: ThfModalAction = {
    action: () => this.advancedFilter.close(),
    label: 'Cancelar'
  };

  public readonly disclaimerGroup: ThfDisclaimerGroup = {
    change: this.onChangeDisclaimerGroup.bind(this),
    title: 'Filtros aplicados em nossa pesquisa',
    disclaimers: [],
  };

  public readonly actions: Array<ThfPageAction> = [
    { action: this.onNewCustomer.bind(this), label: 'Cadastrar', icon: 'thf-icon-user-add' }
  ];

  public readonly tableActions: Array<ThfTableAction> = [
    { action: this.onViewCustomer.bind(this), label: 'Visualisar' },
    { action: this.onEditCustomer.bind(this), disabled: this.canEditCustomer.bind(this), label: 'Editar' }
  ];

  @ViewChild('advancedFilter') advancedFilter: ThfModalComponent;

  constructor(private httpClient: HttpClient, private router: Router) { }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.customerSub.unsubscribe();
  }

  private sendEmail(email, customer) {
    const body = `Olá ${customer.name}, gostariamos de agradecer seu contato.`;
    const subject = 'Contato';

    window.open(`malito:${email}?subject=${subject}&body=${body}`, '_self');
  }

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

  private onActionSearch() {
    this.disclaimerGroup.disclaimers = [{
      label: `Pesquisa rápida: ${this.searchTerm}`,
      property: 'search',
      value: this.searchTerm
    }];
  }

  private showMore() {
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

  private openAdvancedFilter() {
    this.advancedFilter.open();
  }

  private onConfirmAdvancedFilter() {
    const addDisclaimers = (property: string, value: string, label: string) =>
      value && this.disclaimerGroup.disclaimers.push({ property, value, label: `${label}: ${value}` });

    this.disclaimerGroup.disclaimers = [];

    addDisclaimers('city', this.city, 'Cidade');
    addDisclaimers('genre', this.genre, 'Gênero');
    addDisclaimers('name', this.name, 'Nome');
    addDisclaimers('status', this.status ? this.status.join(', ') : '', 'Status')

    this.advancedFilter.close();
  }

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

  private onNewCustomer() {
    this.router.navigateByUrl('/customers/new');
  }

  private onViewCustomer(customer) {
    this.router.navigateByUrl(`/customers/view/${customer.id}`);
  }

  private onEditCustomer(customer) {
    this.router.navigateByUrl(`/customers/edit/${customer.id}`);
  }

  private canEditCustomer(customer) {
    return customer.status !== 'Active';
  }
}
