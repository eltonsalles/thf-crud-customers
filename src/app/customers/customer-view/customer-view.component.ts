import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { ThfNotificationService } from '@totvs/thf-ui';

import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.css']
})
export class CustomerViewComponent implements OnDestroy, OnInit {

  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';

  private customerSub: Subscription;
  private paramsSub: Subscription;
  private customerRemoveSub: Subscription;

  public customer: any = {};

  constructor(
    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private thfNotification: ThfNotificationService) { }

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => this.loadData(params['id']));
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();
    this.customerSub.unsubscribe();

    if (this.customerRemoveSub) {
      this.customerRemoveSub.unsubscribe();
    }
  }

  // Carrega os dados do cliente conforme o id
  private loadData(id) {
    this.customerSub = this.httpClient.get(`${this.url}/${id}`)
      .pipe(map((customer: any) => {
        const status = { Active: 'Ativo', Inactive: 'Inativo' };
        const genre = { Female: 'Feminino', Male: 'Masculino', Other: 'Outros' };

        customer.status = status[customer.status];
        customer.genre = genre[customer.genre];

        return customer;
      }))
      .subscribe(response => this.customer = response);
  }

  // Quando é criado esse método o thf-page-detail cria um botão de navegação 'voltar'
  back() {
    this.router.navigateByUrl('customers');
  }

  // Quando é criado esse método o thf-page-detail cria um botão de navegação 'editar'
  edit() {
    this.router.navigateByUrl(`customers/edit/${this.customer.id}`);
  }

  // Quando é criado esse método o thf-page-detail cria um botão de navegação 'remover'
  remove() {
    this.customerRemoveSub = this.httpClient.delete(`${this.url}/${this.customer.id}`)
      .subscribe(() => {
        this.thfNotification.warning('Cadastro do cliente apagado com sucesso');
        this.back();
      });
  }
}
