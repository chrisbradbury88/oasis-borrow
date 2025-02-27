import BigNumber from 'bignumber.js'
import { useAutomationContext } from 'components/AutomationContextProvider'
import { AutoBSFormChange } from 'features/automation/common/state/autoBSFormChange'
import { one } from 'helpers/zero'
import React from 'react'

import { AddAutoSellInfoSection } from '../controls/AddAutoSellInfoSection'

interface AutoSellInfoSectionControlProps {
  autoSellState: AutoBSFormChange
  debtDelta: BigNumber
  collateralDelta: BigNumber
  executionPrice: BigNumber
  maxGasFee?: number
}

export function AutoSellInfoSectionControl({
  autoSellState,
  debtDelta,
  collateralDelta,
  executionPrice,
  maxGasFee,
}: AutoSellInfoSectionControlProps) {
  const {
    positionData: { token, debt, lockedCollateral },
  } = useAutomationContext()

  const deviationPercent = autoSellState.deviation.div(100)
  const targetRatioWithDeviationFloor = one
    .minus(deviationPercent)
    .times(autoSellState.targetCollRatio)
  const targetRatioWithDeviationCeiling = one
    .plus(deviationPercent)
    .times(autoSellState.targetCollRatio)

  return (
    <AddAutoSellInfoSection
      targetCollRatio={autoSellState.targetCollRatio}
      multipleAfterSell={one.div(autoSellState.targetCollRatio.div(100).minus(one)).plus(one)}
      execCollRatio={autoSellState.execCollRatio}
      nextSellPrice={executionPrice}
      collateralAfterNextSell={{
        value: lockedCollateral,
        secondaryValue: lockedCollateral.plus(collateralDelta),
      }}
      outstandingDebtAfterSell={{
        value: debt,
        secondaryValue: debt.plus(debtDelta),
      }}
      ethToBeSoldAtNextSell={collateralDelta.abs()}
      token={token}
      targetRatioWithDeviationCeiling={targetRatioWithDeviationCeiling}
      targetRatioWithDeviationFloor={targetRatioWithDeviationFloor}
      maxGasFee={maxGasFee}
    />
  )
}
