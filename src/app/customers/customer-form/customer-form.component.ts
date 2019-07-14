import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ThfNotificationService, ThfSelectOption } from '@totvs/thf-ui';

// Variáveis para ajudar da configuração da págia conforme a ação executada pelo usuário
const actionInsert = 'insert';
const actionUpdate = 'update';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnDestroy, OnInit {

  private readonly url: string = 'https://sample-customers-api.herokuapp.com/api/thf-samples/v1/people';

  private customerSub: Subscription;
  private paramsSub: Subscription;

  public customer: any = {};

  // Sempre começa com insert
  private action: string = actionInsert;

  // Lista dos gêneros
  public readonly genreOptions: Array<ThfSelectOption> = [
    { label: 'Feminino', value: 'Female' },
    { label: 'Masculino', value: 'Male' },
    { label: 'Outros', value: 'Other' }
  ];

  constructor(
    private thfNotification: ThfNotificationService,
    private router: Router,
    private route: ActivatedRoute,
    private httpClient: HttpClient) { }

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadData(params['id']);
        this.action = actionUpdate;
      }
    });
  }

  ngOnDestroy() {
    this.paramsSub.unsubscribe();

    if (this.customerSub) {
      this.customerSub.unsubscribe();
    }
  }

  // Verifica se a operação realizada é alteração (Caso seja é necessário bloquear alguns campos, por exemplo, status, nome e email)
  get isUpdateOperation() {
    return this.action === actionUpdate;
  }

  // Altera o título da página conforme a ação aplicada pelo usuário
  get title() {
    return this.isUpdateOperation ? 'Atualizando dados do cliente' : 'Novo cliente';
  }

  // Quando é criado esse método o thf-page-edit cria um botão de ação 'salvar'
  save() {
    const customer = { ...this.customer };

    customer.status = customer.status ? 'Active' : 'Inactive';

    this.customerSub = this.isUpdateOperation
      ? this.httpClient.put(`${this.url}/${customer.id}`, customer)
        .subscribe(() => this.navigateToList('Cliente atualizado com sucesso'))
      : this.httpClient.post(this.url, this.customer)
        .subscribe(() => this.navigateToList('Cliente cadastrado com sucesso'))
  }

  // Quando é criado esse método o thf-page-edit cria um botão de navegação 'voltar'
  cancel() {
    this.router.navigateByUrl('/customers');
  }

  // Exibe a mensagem conforme for e navega de volta para a listagem dos clientes
  private navigateToList(msg: string) {
    this.thfNotification.success(msg);
    this.router.navigateByUrl('/customers');
  }

  // Carrega os dados do cliente conforme o id
  private loadData(id) {
    this.customerSub = this.httpClient.get(`${this.url}/${id}`)
      .pipe(
        map((customer:any) => {
          customer.status = customer.status === 'active';
          return customer;
        })
      )
      .subscribe(response => this.customer = response);
  }
}
