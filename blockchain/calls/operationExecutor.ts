import { TxMeta } from '@oasisdex/transactions'
import BigNumber from 'bignumber.js'
import * as accountImplementation from 'blockchain/abi/account-implementation.json'
import * as dsProxy from 'blockchain/abi/ds-proxy.json'
import { TransactionDef } from 'blockchain/calls/callsHelpers'
import { contractDesc } from 'blockchain/config'
import { ContextConnected } from 'blockchain/network'
import { DsProxy, OperationExecutor } from 'types/ethers-contracts'

import { zero } from '../../helpers/zero'
import { AccountImplementation } from '../../types/ethers-contracts/AccountImplementation'
import { amountToWei } from '../utils'
import { TxMetaKind } from './txMeta'

export interface OperationExecutorTxMeta extends TxMeta {
  kind: TxMetaKind.operationExecutor
  calls: any // TODO: Should be ActionCall[] instead of any but it needs to update common lib.
  operationName: string
  proxyAddress: string
  token?: string
  amount?: BigNumber
}

export const callOperationExecutorWithDsProxy: TransactionDef<OperationExecutorTxMeta> = {
  call: (args, { contract }) => {
    return contract<DsProxy>(contractDesc(dsProxy, args.proxyAddress)).methods[
      'execute(address,bytes)'
    ]
  },
  prepareArgs: (data, context) => {
    return [context.operationExecutor.address, getCallData(data, context)]
  },
  options: ({ token, amount = zero }) =>
    token === 'ETH' && amount.gt(zero) ? { value: amountToWei(amount, 'ETH').toFixed(0) } : {},
}

export const callOperationExecutorWithDpmProxy: TransactionDef<OperationExecutorTxMeta> = {
  call: (args, { contract }) => {
    return contract<AccountImplementation>(contractDesc(accountImplementation, args.proxyAddress))
      .methods['execute(address,bytes)']
  },
  prepareArgs: (data, context) => {
    return [context.operationExecutor.address, getCallData(data, context)]
  },
  options: ({ token, amount = zero }) =>
    token === 'ETH' && amount.gt(zero) ? { value: amountToWei(amount, 'ETH').toFixed(0) } : {},
}

function getCallData(data: OperationExecutorTxMeta, context: ContextConnected) {
  return context
    .contract<OperationExecutor>(context.operationExecutor)
    .methods.executeOp(data.calls, data.operationName)
    .encodeABI()
}
