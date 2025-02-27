/* eslint-disable func-style */
import BigNumber from 'bignumber.js'
import { collateralPriceAtRatio } from 'blockchain/vault.maths'
import {
  DEFAULT_THRESHOLD_FROM_LOWEST_POSSIBLE_SL_VALUE,
  MIX_MAX_COL_RATIO_TRIGGER_OFFSET,
  NEXT_COLL_RATIO_OFFSET,
} from 'features/automation/common/consts'
import {
  hasInsufficientEthFundsForTx,
  hasMoreDebtThanMaxForStopLoss,
  hasPotentialInsufficientEthFundsForTx,
  isStopLossTriggerCloseToAutoSellTrigger,
  isStopLossTriggerCloseToConstantMultipleSellTrigger,
  isStopLossTriggerHigherThanAutoBuyTarget,
} from 'features/automation/common/validation/validators'
import {
  ContextWithoutMetadata,
  StopLossDetailCards,
  StopLossMetadata,
} from 'features/automation/metadata/types'
import {
  getCollateralDuringLiquidation,
  getDynamicStopLossPrice,
  getMaxToken,
  getSliderPercentageFill,
  getStartingSlRatio,
} from 'features/automation/protection/stopLoss/helpers'
import { StopLossResetData } from 'features/automation/protection/stopLoss/state/StopLossFormChange'
import { formatPercent } from 'helpers/formatters/format'

export function getMakerStopLossMetadata(context: ContextWithoutMetadata): StopLossMetadata {
  const {
    triggerData: {
      autoSellTriggerData,
      stopLossTriggerData: { isStopLossEnabled, isToCollateral, stopLossLevel },
      constantMultipleTriggerData,
    },
    positionData: {
      positionRatio,
      nextPositionRatio,
      liquidationRatio,
      liquidationPrice,
      liquidationPenalty,
      lockedCollateral,
      debt,
    },
  } = context

  const collateralDuringLiquidation = getCollateralDuringLiquidation({
    lockedCollateral,
    debt,
    liquidationPrice,
    liquidationPenalty,
  })

  const sliderMin = liquidationRatio.plus(MIX_MAX_COL_RATIO_TRIGGER_OFFSET.div(100)).times(100)
  const sliderMax = new BigNumber(
    (autoSellTriggerData.isTriggerEnabled
      ? autoSellTriggerData.execCollRatio.minus(MIX_MAX_COL_RATIO_TRIGGER_OFFSET).div(100)
      : constantMultipleTriggerData.isTriggerEnabled
      ? constantMultipleTriggerData.sellExecutionCollRatio
          .minus(MIX_MAX_COL_RATIO_TRIGGER_OFFSET)
          .div(100)
      : nextPositionRatio.minus(NEXT_COLL_RATIO_OFFSET.div(100))
    )
      .multipliedBy(100)
      .toFixed(0, BigNumber.ROUND_DOWN),
  )

  const initialSlRatioWhenTriggerDoesntExist = getStartingSlRatio({
    stopLossLevel,
    isStopLossEnabled,
    initialStopLossSelected: sliderMin
      .plus(DEFAULT_THRESHOLD_FROM_LOWEST_POSSIBLE_SL_VALUE.times(100))
      .div(100),
  })
    .times(100)
    .decimalPlaces(0, BigNumber.ROUND_DOWN)

  const resetData: StopLossResetData = {
    stopLossLevel: initialSlRatioWhenTriggerDoesntExist,
    collateralActive: isToCollateral,
    txDetails: {},
  }

  const triggerMaxToken = getMaxToken({
    stopLossLevel: stopLossLevel.times(100),
    lockedCollateral,
    liquidationRatio,
    liquidationPrice,
    debt,
  })

  const dynamicStopLossPrice = getDynamicStopLossPrice({
    liquidationPrice,
    liquidationRatio,
    stopLossLevel: stopLossLevel.times(100),
  })

  return {
    callbacks: {},
    detailCards: {
      cardsSet: [
        StopLossDetailCards.STOP_LOSS_LEVEL,
        StopLossDetailCards.COLLATERIZATION_RATIO,
        StopLossDetailCards.DYNAMIC_STOP_PRICE,
        StopLossDetailCards.ESTIMATED_TOKEN_ON_TRIGGER,
      ],
      cardsConfig: {
        // most likely it won't be needed when we switch to LTV in maker
        stopLossLevelCard: {
          modalDescription: 'manage-multiply-vault.card.stop-loss-coll-ratio-desc',
          belowCurrentPositionRatio: formatPercent(positionRatio.minus(stopLossLevel).times(100), {
            precision: 2,
          }),
        },
      },
    },
    methods: {
      getExecutionPrice: ({ stopLossLevel }) =>
        collateralPriceAtRatio({
          colRatio: stopLossLevel.div(100),
          collateral: lockedCollateral,
          vaultDebt: debt,
        }),
      getMaxToken: ({ stopLossLevel }) =>
        getMaxToken({
          stopLossLevel,
          lockedCollateral,
          liquidationRatio,
          liquidationPrice,
          debt,
        }),
      getRightBoundary: ({ stopLossLevel }) =>
        stopLossLevel
          .dividedBy(100)
          .multipliedBy(context.environmentData.nextCollateralPrice)
          .dividedBy(nextPositionRatio),
      getSliderPercentageFill: ({ stopLossLevel }) =>
        getSliderPercentageFill({
          value: stopLossLevel,
          min: sliderMin,
          max: sliderMax,
        }),
    },
    settings: {
      sliderStep: 1,
    },
    translations: {
      ratioParamTranslationKey: 'system.collateral-ratio',
    },
    validation: {
      getAddErrors: ({ state: { stopLossLevel, txDetails } }) => ({
        hasInsufficientEthFundsForTx: hasInsufficientEthFundsForTx({
          context,
          txError: txDetails?.txError,
        }),
        hasMoreDebtThanMaxForStopLoss: hasMoreDebtThanMaxForStopLoss({ context }),
        isStopLossTriggerHigherThanAutoBuyTarget: isStopLossTriggerHigherThanAutoBuyTarget({
          context,
          stopLossLevel,
        }),
      }),
      getAddWarnings: ({ gasEstimationUsd, state: { stopLossLevel } }) => ({
        hasPotentialInsufficientEthFundsForTx: hasPotentialInsufficientEthFundsForTx({
          context,
          gasEstimationUsd,
        }),
        isStopLossTriggerCloseToAutoSellTrigger: isStopLossTriggerCloseToAutoSellTrigger({
          context,
          sliderMax,
          stopLossLevel,
        }),
        isStopLossTriggerCloseToConstantMultipleSellTrigger: isStopLossTriggerCloseToConstantMultipleSellTrigger(
          {
            context,
            sliderMax,
            stopLossLevel,
          },
        ),
      }),
      cancelErrors: ['hasInsufficientEthFundsForTx'],
      cancelWarnings: ['hasPotentialInsufficientEthFundsForTx'],
    },
    values: {
      collateralDuringLiquidation,
      initialSlRatioWhenTriggerDoesntExist,
      resetData,
      sliderMax,
      sliderMin,
      triggerMaxToken,
      dynamicStopLossPrice,
    },
  }
}
