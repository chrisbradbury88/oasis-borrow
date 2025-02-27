import { IPosition } from '@oasisdex/oasis-actions'
import { Flex } from '@theme-ui/components'
import { useTranslation } from 'next-i18next'
import React from 'react'

import { amountFromWei } from '../../../../../blockchain/utils'
import {
  VaultChangesInformationArrow,
  VaultChangesInformationItem,
} from '../../../../../components/vault/VaultChangesInformation'
import { formatAmount } from '../../../../../helpers/formatters/format'

interface DebtCollateralInformation {
  currentPosition: IPosition
  newPosition: IPosition
}

function formatDebtAmount(pos: IPosition) {
  return `${formatAmount(
    amountFromWei(pos.debt.amount, pos.debt.symbol),
    pos.debt.symbol === 'USDC' ? 'USD' : pos.debt.symbol,
  )} ${pos.debt.symbol}`
}

function formatCollateralAmount(pos: IPosition) {
  return `${formatAmount(
    amountFromWei(
      pos.collateral.amount,
      pos.collateral.symbol === 'USDC' ? 'USD' : pos.collateral.symbol,
    ),
    pos.collateral.symbol,
  )} ${pos.collateral.symbol}`
}

export function OutstandingDebtInformation({
  currentPosition,
  newPosition,
}: DebtCollateralInformation) {
  const { t } = useTranslation()

  return (
    <VaultChangesInformationItem
      label={t('vault-changes.outstanding-debt')}
      value={
        <Flex>
          {formatDebtAmount(currentPosition)}
          <VaultChangesInformationArrow />
          {formatDebtAmount(newPosition)}
        </Flex>
      }
    />
  )
}

export function TotalCollateralInformation({
  currentPosition,
  newPosition,
}: DebtCollateralInformation) {
  const { t } = useTranslation()

  return (
    <VaultChangesInformationItem
      label={t('system.total-collateral')}
      value={
        <Flex>
          {formatCollateralAmount(currentPosition)}
          <VaultChangesInformationArrow />
          {formatCollateralAmount(newPosition)}
        </Flex>
      }
    />
  )
}
