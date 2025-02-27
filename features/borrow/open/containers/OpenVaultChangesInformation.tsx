import { Flex, Text } from '@theme-ui/components'
import BigNumber from 'bignumber.js'
import { OpenFlowStopLossSummary } from 'components/OpenFlowStopLossSummary'
import {
  VaultChangesInformationArrow,
  VaultChangesInformationContainer,
  VaultChangesInformationEstimatedGasFee,
  VaultChangesInformationItem,
} from 'components/vault/VaultChangesInformation'
import { getCollRatioColor } from 'components/vault/VaultDetails'
import { formatCryptoBalance, formatPercent } from 'helpers/formatters/format'
import { useFeatureToggle } from 'helpers/useFeatureToggle'
import { zero } from 'helpers/zero'
import { useTranslation } from 'next-i18next'
import React from 'react'

import { OpenVaultState } from '../pipes/openVault'

export function OpenVaultChangesInformation(props: OpenVaultState) {
  const { t } = useTranslation()
  const {
    token,
    afterCollateralizationRatio,
    afterLiquidationPrice,
    afterFreeCollateral,
    generateAmount,
    maxGenerateAmountCurrentPrice,
    inputAmountsEmpty,
    depositAmount,
    stopLossSkipped,
    stopLossLevel,
    ilkData,
    visitedStopLossStep,
  } = props
  const collRatioColor = getCollRatioColor(props, afterCollateralizationRatio)
  const stopLossWriteEnabled = useFeatureToggle('StopLossWrite')

  // starting zero balance for UI to show arrows
  const zeroBalance = formatCryptoBalance(zero)

  return !inputAmountsEmpty ? (
    <VaultChangesInformationContainer title="Vault changes">
      <VaultChangesInformationItem
        label={`${t('system.collateral-locked')}`}
        value={
          <Flex>
            {zeroBalance} {token}
            <VaultChangesInformationArrow />
            {formatCryptoBalance(depositAmount || zero)} {token}
          </Flex>
        }
      />
      <VaultChangesInformationItem
        label={`${t('system.collateralization-ratio')}`}
        value={
          <Flex>
            {formatPercent(zero.times(100), {
              precision: 2,
              roundMode: BigNumber.ROUND_DOWN,
            })}
            <VaultChangesInformationArrow />
            <Text sx={{ color: collRatioColor }}>
              {formatPercent(afterCollateralizationRatio.times(100), {
                precision: 2,
                roundMode: BigNumber.ROUND_DOWN,
              })}
            </Text>
          </Flex>
        }
      />
      <VaultChangesInformationItem
        label={`${t('system.liquidation-price')}`}
        value={
          <Flex>
            {`$${zeroBalance}`}
            <VaultChangesInformationArrow />
            {`$${formatCryptoBalance(afterLiquidationPrice || zero)}`}
          </Flex>
        }
      />
      <VaultChangesInformationItem
        label={`${t('system.vault-dai-debt')}`}
        value={
          <Flex>
            {zeroBalance} DAI
            <VaultChangesInformationArrow />
            {formatCryptoBalance(generateAmount || zero)} DAI
          </Flex>
        }
      />
      <VaultChangesInformationItem
        label={`${t('system.available-to-withdraw')}`}
        value={
          <Flex>
            {zeroBalance} {token}
            <VaultChangesInformationArrow />
            {formatCryptoBalance(afterFreeCollateral || zero)} {token}
          </Flex>
        }
      />
      <VaultChangesInformationItem
        label={`${t('system.available-to-generate')}`}
        value={
          <Flex>
            {zeroBalance} DAI
            <VaultChangesInformationArrow />
            {formatCryptoBalance(maxGenerateAmountCurrentPrice.minus(generateAmount || zero))} DAI
          </Flex>
        }
      />
      <VaultChangesInformationEstimatedGasFee {...props} />
      {stopLossWriteEnabled && visitedStopLossStep && !stopLossSkipped && (
        <OpenFlowStopLossSummary
          stopLossLevel={stopLossLevel}
          liquidationRatio={ilkData.liquidationRatio}
          afterLiquidationPrice={afterLiquidationPrice}
        />
      )}
    </VaultChangesInformationContainer>
  ) : null
}
