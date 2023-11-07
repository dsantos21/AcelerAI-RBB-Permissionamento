# _Smart Contracts_ de Permissionamento

## Versões de interface do contrato de permissionamento

Especificação técnica da versão 1:
<https://entethalliance.org/wp-content/uploads/2020/06/EEA_Enterprise_Ethereum_Client_Specification_V5.pdf>

Especificação técnica da versão 2:
<https://entethalliance.org/wp-content/uploads/2020/11/EEA_Enterprise_Ethereum_Client_Specification_v6.pdf>

Ver mais especificações: <https://entethalliance.org/technical-specifications/>

Como o besu define a versão e mais informações:
<https://besu.hyperledger.org/en/stable/HowTo/Limit-Access/Specify-Perm-Version/>

## _Versionamento_
Mais informações aqui: https://github.com/RBBNet/rbb/blob/master/Versionamento.md

No repositório do Permissionamento, estamos considerando a API pública como sendo as ABIs dos contratos. 
 _A versão do Permissionamento 1.0.0 é a usada na rede de Laboratório, com a release **v1.0.0+lab01-backend**._ _A release da branch **migrations** ficou como 1.0.1, um patch de correção, apesar de adicionar outras funcionalidades. De acordo com o SemVer, ela seria a 1.1.0._ 
* A build no Permissionamento é nomeada a partir da data de lançamento da release. Exemplo: _v1.0.1+2023-09-28_. Observação: builds anteriores não seguem essa dinâmica.
* Releases são criadas sempre que uma funcionalidade nova é adicionada e a API (no caso, as ABIs) se encontra estável.
* Branches são criadas sempre que está se adicionando uma funcionalidade nova, porém, é necessário lembrar que elas possuem caráter _temporário_. Ou seja, assim que possível, gerar uma tag/release com a funcionalidade.


⚠️ **IMPORTANTE**: ler sessão [_Dinâmica_](https://github.com/RBBNet/rbb/blob/master/Versionamento.md#din%C3%A2mica), que dita o comportamento para a implementação de novas funcionalidades.

## _Branches_
Essa sessão será mantida por motivos históricos, apesar de ter sido adotado o versionamento semântico (SemVer) e uma limpeza de branches ter sido feita. 
_Nota: A versão 1 "pura" dos smart contracts de permissionamento da Consensys (sem as modificações da lacchain) não foi encontrada._

- beta1: contém a implementação do _frontend_ e _backend_ da versão 1 dos _smart contracts_ de permissionamento com modificações feitas pela Lacchain. Essas modificações adicionam informações sobre os nós no contrato, como: o tipo de nó (boot, validator, writer, observer...), geoHash, nome para o nó e o nome da instituição. Essa _branch_ contém a cópia exata do [repositório da lacchain na branch beta1](https://github.com/lacchain/permissioning-smart-contracts/tree/beta1) criada especificamente para a RBB. Os testes automatizados e os _scripts_ de migração **não** acompanharam as mudanças feitas pela lacchain.

- V1_Multisig: versão da _branch_ beta1 com a implementação de múltiplas assinaturas nas transações dos _smart contracts_ de permissionamento. Os testes automatizados, os _scripts_ de migração e o _frontend_ **não** acompanharam essas mudanças feitas.

- V1-backend: contém como base a implementação do _backend_ feito pela lacchain (beta1) com as seguintes modificações:

  - Remoção do IP e porta no registro dos nós.
  - Adição do endereço de quem permissionou e o _block timestamp_ nos eventos de adição e remoção de contas.
  - Adição do endereço de quem permissionou e o _block timestamp_ nos eventos de adição e remoção de contas admin.
  
  Os scripts de migração e os testes automatizados acompanharam essas modificações.

- V2: contém como base a implementação do _frontend_ e _backend_ da versão 2 dos _smart contracts_ de permissionamento [feita pela consensys](https://github.com/ConsenSys/permissioning-smart-contracts) com as seguintes modificações:

  - Modificação feita em `migrations/3_deploy_node_ingress_rules_contract.js` que executa a função `setValidateEnodeIdOnly(true)` para **não** considerar IP e Porta na adição e remoção de nós.
  - Adição do endereço de quem permissionou e o _block timestamp_ nos eventos de adição e remoção de contas.
  ~~- Compatibilidade de instalação dos pacotes em ambiente corporativo. Foi adicionado no `package.json` a dependência `"truffle-corporative": "npm:truffle@5.3.3"` que instala a versão 5.3.3 do truffle (versão máxima do truffle suportada em ambiente corporativo) e nivela as outras dependências com a versão 5.4.24 do truffle.~~

- V2_Multisig_Beta: contém como base a implementação do _frontend_ e _backend_ da versão 2 dos _smart contracts_ de permissionamento [feita pela consensys](https://github.com/ConsenSys/permissioning-smart-contracts) com a implementação **- ainda em desenvolvimento/não concluída -** de múltiplas assinaturas nas transações dos _smart contracts_ de permissionamento. Os testes automatizados, os _scripts_ de migração e o _frontend_ **não** acompanharam essas mudanças feitas.

## Uso

- A [documentação do Besu](https://besu.hyperledger.org/en/stable/Tutorials/Permissioning/Getting-Started-Onchain-Permissioning/)
descreve como utilizar os contratos de permissionamento _onchain_ com o Besu.

~~- Em um ambiente corporativo com proxy, utilize a versão 5.3.3 do truffle. [Versões posteriores a esta não funcionam corretamente nestes ambientes.](https://github.com/trufflesuite/truffle/issues/4016)~~

- Usar uma versão de Node.js compatível com Hardhat. Este projeto foi testado na versão v20.8.1. 

- Os testes automatizados **não** estão presentes no arquivo `permissioningDeploy.tar.gz` contido nas releases. O arquivo `permissioningDeploy.tar.gz` é destinado para ambientes em produção e, portanto, não possui suporte para testes.

## Organização dos diretórios da branch V1-backend

- O diretório _contracts_ contém todos os _smart contracts_ de permissionamento.
- O diretório _scripts/deploy_ contém os _scripts_ para o _deploy_ dos _smart contracts_.
- O diretório _scripts/utils_ contém _scripts_ responsáveis pela obtenção e validação das variáveis de ambiente. As variáveis de ambiente são utilizadas nos _scripts_ de _deploy_ e de testes.
- O diretório _test_ contém os testes automatizados do projeto.
- O diretório _node_modules_ contém todos os pacotes necessários para o projeto. O diretório e os pacotes são criados somente após a instalação das dependências do projeto (ao executar `yarn install`). As dependências do projeto são encontradas no arquivo `package.json`.
- o diretório _artifacts/contracts_ contém as abis dos _smart contracts_. As abis são criadas somente após a compilação dos _smart contracts_.

## Desenvolvimento

_Nota: É recomendável **não** utilizar Windows no processo de desenvolvimento._

### Instalar as dependências

Execute `yarn install` para instalar as dependências do projeto. Essa etapa só é necessária ao configurar o projeto pela primeira vez.

### Compilar

Execute `yarn compile` para compilar os _smart contracts_.

### Testar

Execute `yarn test` para realizar os testes automatizados dos _smart contracts_ de permissionamento.

**OBS:** Se houver um arquivo .env criado, comente as variáveis NODE_INGRESS_CONTRACT_ADDRESS e ACCOUNT_INGRESS_CONTRACT_ADDRESS no arquivo para realizar os testes.

### Levantar Nó Hardhat

Execute `yarn hardhat node` para iniciar um nó Hardhat. Ao iniciar um nó Hardhat, será dado o _endpoint_ do nó Hardhat, uma lista de contas e as chaves privadas correspondentes. Mantenha esse terminal aberto para manter o nó Hardhat em execução. 

Execute `yarn deploy --network localhost` para realizar o _deploy_ dos _smart contracts_ no nó Hardhat. 

**OBS:** Se houver um arquivo .env criado, comente as variáveis NODE_INGRESS_CONTRACT_ADDRESS e ACCOUNT_INGRESS_CONTRACT_ADDRESS no arquivo .env para realizar o _deploy_ inicial no nó Hardhat. Após o deploy inicial, os endereços listados na console para os contratos NodeIngress e AccountIngress podem ser copiados para essas variáveis.

## Produção

- Execute `yarn install` para instalar as dependências do projeto. Essa etapa só é necessária ao configurar o projeto pela primeira vez.

- Crie um arquivo `.env` e defina as variáveis de ambiente neste arquivo conforme template abaixo:

    ```.env
    NODE_INGRESS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000009999
    ACCOUNT_INGRESS_CONTRACT_ADDRESS=0x0000000000000000000000000000000000008888
    BESU_NODE_PERM_ACCOUNT=627306090abaB3A6e1400e9345bC60c78a8BEf57
    BESU_NODE_PERM_KEY=c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3
    BESU_NODE_PERM_ENDPOINT=http://127.0.0.1:8545
    CHAIN_ID=648629
    INITIAL_ADMIN_ACCOUNTS=0x38393851d6d26497de390b37b4eb0c1c20a5b0bc,0xc78622f314453aeb349615bff240b6891cefd465,0x8b708294671a61cb3af2626e45ec8ac228a03dea
    INITIAL_ALLOWLISTED_ACCOUNTS=0x38393851d6d26497de390b37b4eb0c1c20a5b0bc,0xc78622f314453aeb349615bff240b6891cefd465,0x8b708294671a61cb3af2626e45ec8ac228a03dea
    INITIAL_ALLOWLISTED_NODES=enode://7ef6...d416|0|0x000000000000|Boot|BNDES,enode://d350...70d2|1|0x000000000000|Validator|BNDES,enode://971d...5c3c|2|0x000000000000|Writer|BNDES
    ```

  Em `BESU_NODE_PERM_ACCOUNT`, conforme o template, insira o endereço da conta a fazer o deploy e a ser a primeira conta de administração do permissionamento.

  Em `BESU_NODE_PERM_KEY`, insira a chave privada da conta mencionada acima conforme o template.
  > ⚠️ **Atenção!** Certifique-se de utilizar uma chave privada devidamente protegida.

  Em `BESU_NODE_PERM_ENDPOINT`, insira o endereço `IP_Interno:Porta` do seu validator conforme o template. Apenas nesse momento será utilizada a porta RPC do validator - e não do writer - para enviar transações.

  Em `CHAIN_ID`, insira a chain ID da rede conforme o template. A chain ID pode ser encontrada no arquivo `genesis.json`.

  Em `INITIAL_ADMIN_ACCOUNTS`, conforme o template, insira os endereços de conta de administração do permissionamento.

  Em `INITIAL_ALLOWLISTED_ACCOUNTS`, conforme o template, insira os endereços de conta de administração do permissionamento. As listas de administração e de conta (endereços de conta permitidos de enviarem transações na rede) são diferentes e independentes. Desta forma, faz-se necessário adicionar os endereços de conta de adminstração também nesta variável de ambiente para que seja possível enviar transações na rede.

  Em `INITIAL_ALLOWLISTED_NODES`, conforme o template, insira as informações de todos os nós iniciais da rede. As informações de cada nó devem ser separadas por vírgula e devem ser inseridas da seguinte forma:
  
  ```.env
  enode://<chave-pública-SEM-0x>|<tipo-do-nó-(0: Boot, 1: Validator, 2: Writer, 3: WriterPartner, 4: ObserverBoot, 5: Other)>|<geohash-do-nó>|<nome-do-nó>|<nome-da-instituição>
  ```

- Faça o deploy

    ```bash
    yarn deploy --network besu

    ```
