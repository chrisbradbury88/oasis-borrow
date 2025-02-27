import BigNumber from 'bignumber.js'
import { IlkData } from 'blockchain/ilks'
import { Context } from 'blockchain/network'
import { Tickers } from 'blockchain/prices'
import { collateralPriceAtRatio } from 'blockchain/vault.maths'
import { AutomationPositionData } from 'components/AutomationContextProvider'
import {
  MIX_MAX_COL_RATIO_TRIGGER_OFFSET,
  NEXT_COLL_RATIO_OFFSET,
} from 'features/automation/common/consts'
import { StopLossMetadata } from 'features/automation/metadata/types'
import {
  getCollateralDuringLiquidation,
  getMaxToken,
  getSliderPercentageFill,
} from 'features/automation/protection/stopLoss/helpers'
import { SidebarAdjustStopLossEditingStageProps } from 'features/automation/protection/stopLoss/sidebars/SidebarAdjustStopLossEditingStage'
import {
  StopLossFormChange,
  StopLossResetData,
} from 'features/automation/protection/stopLoss/state/StopLossFormChange'
import { CloseVaultTo } from 'features/multiply/manage/pipes/manageMultiplyVault'
import { BalanceInfo } from 'features/shared/balanceInfo'
import { PriceInfo } from 'features/shared/priceInfo'
import { VaultProtocol } from 'helpers/getVaultProtocol'
import { zero } from 'helpers/zero'

export type OpenVaultStopLossLevelChange = {
  kind: 'stopLossLevel'
  level: BigNumber
}

export type OpenVaultStopLossCloseTypeChange = {
  kind: 'stopLossCloseType'
  type: 'dai' | 'collateral'
}

export type OpenVaultStopLossChanges =
  | OpenVaultStopLossLevelChange
  | OpenVaultStopLossCloseTypeChange

export function applyOpenVaultStopLoss<S>(state: S, change: OpenVaultStopLossChanges) {
  if (change.kind === 'stopLossLevel') {
    return {
      ...state,
      stopLossLevel: change.level,
    }
  }

  if (change.kind === 'stopLossCloseType') {
    return {
      ...state,
      stopLossCloseType: change.type,
    }
  }

  return state
}

export function getDataForStopLoss(
  props: {
    token: string
    priceInfo: PriceInfo
    ilkData: IlkData
    balanceInfo: BalanceInfo
    afterCollateralizationRatioAtNextPrice: BigNumber
    afterCollateralizationRatio: BigNumber
    afterLiquidationPrice: BigNumber
    setStopLossCloseType: (type: CloseVaultTo) => void
    setStopLossLevel: (level: BigNumber) => void
    stopLossCloseType: CloseVaultTo
    proxyAddress?: string
    stopLossLevel: BigNumber
    totalExposure?: BigNumber
    depositAmount?: BigNumber
    generateAmount?: BigNumber
    afterOutstandingDebt?: BigNumber
  },
  feature: 'borrow' | 'multiply',
) {
  const {
    token,
    priceInfo: { nextCollateralPrice, currentEthPrice, currentCollateralPrice },
    ilkData,
    afterCollateralizationRatio,
    afterCollateralizationRatioAtNextPrice,
    afterLiquidationPrice,
    totalExposure,
    depositAmount,
    ilkData: { ilk, liquidationPenalty, liquidationRatio, debtFloor },
    balanceInfo: { ethBalance },
    setStopLossCloseType,
    setStopLossLevel,
    stopLossCloseType,
    stopLossLevel,
    afterOutstandingDebt,
    generateAmount,
    proxyAddress,
  } = props

  const debt = feature === 'multiply' ? afterOutstandingDebt : generateAmount
  const lockedCollateral = feature === 'multiply' ? totalExposure : depositAmount

  const collateralDuringLiquidation =
    !lockedCollateral || !debt
      ? zero
      : getCollateralDuringLiquidation({
          lockedCollateral,
          debt,
          liquidationPrice: afterLiquidationPrice,
          liquidationPenalty,
        })

  const sliderMin = ilkData.liquidationRatio
    .multipliedBy(100)
    .plus(MIX_MAX_COL_RATIO_TRIGGER_OFFSET)
  const sliderMax = new BigNumber(
    afterCollateralizationRatioAtNextPrice
      .minus(NEXT_COLL_RATIO_OFFSET.div(100))
      .multipliedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN),
  )

  const afterNewLiquidationPrice = stopLossLevel
    .dividedBy(100)
    .multipliedBy(nextCollateralPrice)
    .dividedBy(afterCollateralizationRatioAtNextPrice)

  const executionPrice = collateralPriceAtRatio({
    colRatio: stopLossLevel.div(100),
    collateral: lockedCollateral || zero,
    vaultDebt: debt || zero,
  })

  const sliderPercentageFill = getSliderPercentageFill({
    value: stopLossLevel,
    min: sliderMin,
    max: sliderMax,
  })

  const stopLossSidebarProps: SidebarAdjustStopLossEditingStageProps = {
    executionPrice,
    errors: [],
    warnings: [],
    stopLossState: {
      stopLossLevel,
      collateralActive: stopLossCloseType === 'collateral',
      currentForm: 'add',
    } as StopLossFormChange,
    isEditing: true,
    isOpenFlow: true,
  }

  const maxToken = getMaxToken({
    stopLossLevel: stopLossLevel,
    lockedCollateral: lockedCollateral || zero,
    liquidationRatio,
    liquidationPrice: afterLiquidationPrice,
    debt: debt || zero,
  })

  function getOpenVaultStopLossMetadata(): StopLossMetadata {
    return {
      callbacks: {
        onCloseToChange: ({ optionName }) => setStopLossCloseType(optionName as CloseVaultTo),
        onSliderChange: ({ value }) => setStopLossLevel(value),
      },
      methods: {
        getExecutionPrice: () => executionPrice,
        getMaxToken: () => maxToken,
        getRightBoundary: () => afterNewLiquidationPrice,
        getSliderPercentageFill: () => sliderPercentageFill,
      },
      settings: {
        sliderStep: 1,
      },
      translations: {
        ratioParamTranslationKey: 'system.collateral-ratio',
      },
      validation: {
        getAddErrors: () => ({}),
        getAddWarnings: () => ({}),
        cancelErrors: [],
        cancelWarnings: [],
      },
      values: {
        collateralDuringLiquidation,
        initialSlRatioWhenTriggerDoesntExist: zero,
        resetData: {} as StopLossResetData,
        sliderMax,
        sliderMin,
        triggerMaxToken: zero,
        dynamicStopLossPrice: zero,
      },
    }
  }

  const automationContextProps = {
    ethBalance,
    context: { status: 'connected', account: '0x0', etherscan: { url: '' } } as Context,
    ethAndTokenPricesData: { ETH: currentEthPrice, [token]: currentCollateralPrice } as Tickers,
    positionData: {
      positionRatio: afterCollateralizationRatio,
      nextPositionRatio: afterCollateralizationRatioAtNextPrice,
      debt,
      debtFloor,
      debtOffset: zero,
      id: zero,
      ilk,
      liquidationPenalty,
      liquidationPrice: afterLiquidationPrice,
      liquidationRatio,
      lockedCollateral,
      owner: proxyAddress,
      token,
      vaultType: feature,
    } as AutomationPositionData,
    commonData: {
      controller: '0x0',
      nextCollateralPrice,
      token,
    },
    protocol: VaultProtocol.Maker,
    metadata: {
      stopLoss: getOpenVaultStopLossMetadata,
    },
  }

  return { stopLossSidebarProps, automationContextProps }
}

export type StopLossOpenFlowStages =
  | 'stopLossEditing'
  | 'stopLossTxWaitingForConfirmation'
  | 'stopLossTxWaitingForApproval'
  | 'stopLossTxInProgress'
  | 'stopLossTxFailure'
  | 'stopLossTxSuccess'
