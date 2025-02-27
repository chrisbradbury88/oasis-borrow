import { Icon } from '@makerdao/dai-ui-icons'
import { useAutomationContext } from 'components/AutomationContextProvider'
import {
  AUTO_SELL_FORM_CHANGE,
  AutoBSFormChange,
} from 'features/automation/common/state/autoBSFormChange'
import { ProtectionDetailsControl } from 'features/automation/protection/common/controls/ProtectionDetailsControl'
import { ProtectionFormControl } from 'features/automation/protection/common/controls/ProtectionFormControl'
import {
  STOP_LOSS_FORM_CHANGE,
  StopLossFormChange,
} from 'features/automation/protection/stopLoss/state/StopLossFormChange'
import { VaultNotice } from 'features/notices/VaultsNoticesView'
import { VaultContainerSpinner, WithLoadingIndicator } from 'helpers/AppSpinner'
import { useObservable } from 'helpers/observableHook'
import { useUIChanges } from 'helpers/uiChangesHook'
import { useFeatureToggle } from 'helpers/useFeatureToggle'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { Container } from 'theme-ui'

import { useAppContext } from '../AppContextProvider'
import { AppLink } from '../Links'
import { DefaultVaultLayout } from './DefaultVaultLayout'

interface ZeroDebtProtectionBannerProps {
  useTranslationKeys?: boolean
  header: string
  description: string
  showLink?: boolean
}

function ZeroDebtProtectionBanner({
  useTranslationKeys = true,
  header,
  description,
  showLink = true,
}: ZeroDebtProtectionBannerProps) {
  const { t } = useTranslation()

  return (
    <VaultNotice
      status={<Icon size="34px" name="warning" />}
      withClose={false}
      header={useTranslationKeys ? t(header) : header}
      subheader={
        <>
          {useTranslationKeys ? t(description) : description}
          {showLink && (
            <>
              {', '}
              <AppLink href="https://kb.oasis.app/help/stop-loss-protection" sx={{ fontSize: 3 }}>
                {t('here')}.
              </AppLink>
            </>
          )}
        </>
      }
      color="primary100"
    />
  )
}

function getZeroDebtProtectionBannerProps({
  stopLossWriteEnabled,
  isVaultDebtZero,
  isVaultDebtBelowDustLumit,
  vaultHasNoProtection,
}: {
  stopLossWriteEnabled: boolean
  isVaultDebtZero: boolean
  isVaultDebtBelowDustLumit: boolean
  vaultHasNoProtection?: boolean
}): ZeroDebtProtectionBannerProps {
  if (stopLossWriteEnabled) {
    if (isVaultDebtZero && vaultHasNoProtection) {
      return {
        header: 'protection.zero-debt-heading',
        description: 'protection.zero-debt-description',
      }
    } else if (isVaultDebtBelowDustLumit) {
      return {
        header: 'protection.below-dust-limit-heading',
        description: 'protection.zero-debt-description',
      }
    } else
      return {
        header: 'protection.unable-to-access-protection',
        description: 'please-try-again-later',
        showLink: false,
      }
  } else {
    return {
      useTranslationKeys: false,
      showLink: false,
      header: 'Creation of the new stop loss trigger is currently disabled.',
      description:
        "To protect our users, due to extreme adversarial market conditions we have currently disabled setting up NEW stop loss triggers, as they might not result in the expected outcome. Please use the 'close vault' option if you want to close your vault right now.",
    }
  }
}

export function ProtectionControl() {
  const { txHelpers$ } = useAppContext()
  const {
    positionData: { debt, debtFloor },
    triggerData: { autoSellTriggerData, stopLossTriggerData },
  } = useAutomationContext()
  const [txHelpersData] = useObservable(txHelpers$)
  const [stopLossState] = useUIChanges<StopLossFormChange>(STOP_LOSS_FORM_CHANGE)
  const [autoSellState] = useUIChanges<AutoBSFormChange>(AUTO_SELL_FORM_CHANGE)

  const stopLossWriteEnabled = useFeatureToggle('StopLossWrite')

  const vaultHasActiveTrigger =
    stopLossTriggerData.isStopLossEnabled || autoSellTriggerData.isTriggerEnabled

  return (
    <WithLoadingIndicator
      value={[stopLossState, autoSellState]}
      customLoader={<VaultContainerSpinner />}
    >
      {() =>
        vaultHasActiveTrigger ||
        (!debt.isZero() &&
          debt.gt(debtFloor) &&
          (vaultHasActiveTrigger || stopLossWriteEnabled)) ? (
          <DefaultVaultLayout
            detailsViewControl={<ProtectionDetailsControl />}
            editForm={<ProtectionFormControl txHelpers={txHelpersData} />}
          />
        ) : (
          <Container
            variant="vaultPageContainer"
            sx={{
              zIndex: 0,
            }}
          >
            <ZeroDebtProtectionBanner
              {...getZeroDebtProtectionBannerProps({
                stopLossWriteEnabled,
                isVaultDebtZero: debt.isZero(),
                isVaultDebtBelowDustLumit: debt.lte(debtFloor),
                vaultHasNoProtection: !vaultHasActiveTrigger,
              })}
            />
          </Container>
        )
      }
    </WithLoadingIndicator>
  )
}
