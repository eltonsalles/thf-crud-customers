import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { ThfTableColumn } from '@totvs/thf-ui';

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
  private page: number = 1

  constructor(private httpClient: HttpClient) { }

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

  private loadData() {
    const urlWithPagination = `${this.url}?page=${this.page}`;

    this.loading = true;

    this.customerSub = this.httpClient.get(urlWithPagination)
      .subscribe((response: { hasNext: boolean, items: Array<any> }) => {
        this.customers = [...this.customers, ...response.items];
        this.hasNext = response.hasNext;
        this.page++;
        this.loading = false;
      });
  }

}
