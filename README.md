# Permissionamento

O que é uma operação?
	É a função de um contrato que é executada somente quando um total de 'x' assinaturas (necessárias para aprovação) aprovam a execução da função.
	Exemplos: addAdmin e removeAdmin.

Hash:
	É uma codificação do nome da operação desejada com a carga útil da operação.
	Exemplo: keccak256(abi.encodePacked(ADD_ADMIN, _address))
		ADD_ADMIN: nome da operação
		_address: carga útil
	O tipo do hash é bytes32.
	O objeto do hash é identificar uma operação e uma carga útil para que endereços diferentes votem em um mesmo par operação-carga útil.

addressList:
	O objetivo do addressList é permitir identificar os endereços que votaram em um determinado hash.
	O addressList guarda apenas os endereços que votaram em uma determinada operação que ainda não foi executada.

hasVoted:
	O objetivo do hasVoted é permitir identificar rapidamente, através de um hash, se um determinado endereço votou em uma determinada operação e, se sim, em qual posição ele ocupa no array addressList.
	Dado um determinado hash (de uma operação não realizada) e um determinado endereço, o hasVoted retorna a posição do endereço no array addressList caso o número retornado seja maior que 0. Caso o número retornado seja igual a 0, o endereço dado não existe, ou seja, o endereço não votou no hash dado.

hashesList:
	O objetivo do hashesList é armazenar todos os hashes de operações que ainda não foram executadas.
