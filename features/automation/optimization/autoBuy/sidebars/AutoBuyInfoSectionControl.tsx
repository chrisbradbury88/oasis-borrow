import BigNumber from 'bignumber.js'
import { useAutomationContext } from 'components/AutomationContextProvider'
import { AutoBSFormChange } from 'features/automation/common/state/autoBSFormChange'
import { one } from 'helpers/zero'
import React from 'react'

import { AddAutoBuyInfoSection } from '../controls/AddAutoBuyInfoSection'

interface AutoBuyInfoSectionControlProps {
  executionPrice: BigNumber
  autoBuyState: AutoBSFormChange
  debtDelta: BigNumber
  collateralDelta: BigNumber
}

export function AutoBuyInfoSectionControl({
  executionPrice,
  autoBuyState,
  debtDelta,
  collateralDelta,
}: AutoBuyInfoSectionControlProps) {
  const {
    positionData: { token, debt, lockedCollateral },
  } = useAutomationContext()

  const deviationPercent = autoBuyState.deviation.div(100)
  const targetRatioWithDeviationFloor = one
    .minus(deviationPercent)
    .times(autoBuyState.targetCollRatio)
  const targetRatioWithDeviationCeiling = one
    .plus(deviationPercent)
    .times(autoBuyState.targetCollRatio)

  return (
    <AddAutoBuyInfoSection
      token={token}
      colRatioAfterBuy={autoBuyState.targetCollRatio}
      multipleAfterBuy={one.div(autoBuyState.targetCollRatio.div(100).minus(one)).plus(one)}
      execCollRatio={autoBuyState.execCollRatio}
      nextBuyPrice={executionPrice}
      collateralAfterNextBuy={{
        value: lockedCollateral,
        secondaryValue: lockedCollateral.plus(collateralDelta),
      }}
      outstandingDebtAfterNextBuy={{
        value: debt,
        secondaryValue: debt.plus(debtDelta),
      }}
      collateralToBePurchased={collateralDelta.abs()}
      targetRatioWithDeviationFloor={targetRatioWithDeviationFloor}
      targetRatioWithDeviationCeiling={targetRatioWithDeviationCeiling}
    />
  )
}
