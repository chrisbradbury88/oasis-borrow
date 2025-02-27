import { useActor } from '@xstate/react'
import { AaveReserveConfigurationData } from 'blockchain/calls/aave/aaveProtocolDataProvider'
import { IStrategyConfig } from 'features/aave/common/StrategyConfigTypes'
import { AppSpinner } from 'helpers/AppSpinner'
import { useSimulationYields } from 'helpers/useSimulationYields'
import React from 'react'

import { PreparedAaveReserveData } from '../../../aave/helpers/aavePrepareReserveData'
import { useManageAaveStateMachineContext } from '../../../aave/manage/containers/AaveManageStateMachineContext'
import { PositionInfoComponent } from './PositionInfoComponent'

export type ManageSectionComponentProps = {
  aaveReserveState: AaveReserveConfigurationData
  aaveReserveDataDebtToken: PreparedAaveReserveData
  strategyConfig: IStrategyConfig
}

export function ManageSectionComponent({
  aaveReserveState,
  aaveReserveDataDebtToken,
  strategyConfig,
}: ManageSectionComponentProps) {
  const { stateMachine } = useManageAaveStateMachineContext()
  const [state] = useActor(stateMachine)
  const {
    accountData,
    oraclePrice, // STETH price data
    position,
  } = state.context.protocolData || {}

  const simulations = useSimulationYields({
    amount: accountData?.totalCollateralETH,
    riskRatio: position?.riskRatio,
    fields: ['7Days'],
  })

  if (!accountData?.totalDebtETH || !aaveReserveState?.liquidationThreshold || !oraclePrice) {
    return <AppSpinner />
  }

  return (
    <PositionInfoComponent
      aaveReserveDataDebtToken={aaveReserveDataDebtToken}
      accountData={accountData}
      apy={simulations?.apy}
      tokens={strategyConfig.tokens}
      oraclePrice={oraclePrice}
      position={position}
    />
  )
}
