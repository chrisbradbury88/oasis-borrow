import {
  AutomationEventIds,
  CommonAnalyticsSections,
  Pages,
  trackingEvents,
} from 'analytics/analytics'
import BigNumber from 'bignumber.js'
import { useAppContext } from 'components/AppContextProvider'
import { useAutomationContext } from 'components/AutomationContextProvider'
import { Banner, bannerGradientPresets } from 'components/Banner'
import { DetailsSection } from 'components/DetailsSection'
import { DetailsSectionContentCardWrapper } from 'components/DetailsSectionContentCard'
import { AppLink } from 'components/Links'
import { ContentCardTargetColRatioAfterSell } from 'components/vault/detailsSection/ContentCardTargetColRatioAfterSell'
import { ContentCardTriggerColRatioToSell } from 'components/vault/detailsSection/ContentCardTriggerColRatioToSell'
import {
  AUTOMATION_CHANGE_FEATURE,
  AutomationChangeFeature,
} from 'features/automation/common/state/automationFeatureChange'
import { AutomationFeatures } from 'features/automation/common/types'
import { useUIChanges } from 'helpers/uiChangesHook'
import { useTranslation } from 'next-i18next'
import React from 'react'
import { Text } from 'theme-ui'

interface AutoSellDetailsLayoutProps {
  triggerColRatio?: BigNumber
  nextSellPrice?: BigNumber
  targetColRatio?: BigNumber
  threshold?: BigNumber
  afterTriggerColRatio?: BigNumber
  afterTargetColRatio?: BigNumber
}

export function AutoSellDetailsLayout({
  triggerColRatio,
  nextSellPrice,
  targetColRatio,
  threshold,
  afterTriggerColRatio,
  afterTargetColRatio,
}: AutoSellDetailsLayoutProps) {
  const { t } = useTranslation()
  const { uiChanges } = useAppContext()
  const {
    positionData: { id, ilk, token },
    triggerData: {
      autoSellTriggerData,
      constantMultipleTriggerData: { isTriggerEnabled },
    },
  } = useAutomationContext()

  const isConstantMultipleEnabled = isTriggerEnabled

  const [activeAutomationFeature] = useUIChanges<AutomationChangeFeature>(AUTOMATION_CHANGE_FEATURE)
  const isAutoSellOn = autoSellTriggerData.isTriggerEnabled

  return (
    <>
      {isAutoSellOn ||
      activeAutomationFeature?.currentProtectionFeature === AutomationFeatures.AUTO_SELL ? (
        <DetailsSection
          title={t('auto-sell.title')}
          badge={autoSellTriggerData.isTriggerEnabled}
          content={
            <DetailsSectionContentCardWrapper>
              <ContentCardTriggerColRatioToSell
                token={token}
                triggerColRatio={triggerColRatio}
                afterTriggerColRatio={afterTriggerColRatio}
                nextSellPrice={nextSellPrice}
                changeVariant="positive"
              />
              <ContentCardTargetColRatioAfterSell
                targetColRatio={targetColRatio}
                afterTargetColRatio={afterTargetColRatio}
                threshold={threshold}
                changeVariant="positive"
                token={token}
              />
            </DetailsSectionContentCardWrapper>
          }
        />
      ) : (
        <Banner
          title={t('auto-sell.banner.header')}
          description={[
            <>
              {t('auto-sell.banner.content')}{' '}
              <AppLink href="https://kb.oasis.app/help/auto-buy-and-auto-sell" sx={{ fontSize: 2 }}>
                {t('here')}.
              </AppLink>
            </>,
            ...(isConstantMultipleEnabled
              ? [
                  <Text as="span" sx={{ color: 'primary100', fontWeight: 'semiBold' }}>
                    {t('auto-sell.banner.cm-warning')}
                  </Text>,
                ]
              : []),
          ]}
          image={{
            src: '/static/img/setup-banner/auto-sell.svg',
            backgroundColor: bannerGradientPresets.autoSell[0],
            backgroundColorEnd: bannerGradientPresets.autoSell[1],
          }}
          button={{
            action: () => {
              uiChanges.publish(AUTOMATION_CHANGE_FEATURE, {
                type: 'Protection',
                currentProtectionFeature: AutomationFeatures.AUTO_SELL,
              })
              trackingEvents.automation.buttonClick(
                AutomationEventIds.SelectAutoSell,
                Pages.ProtectionTab,
                CommonAnalyticsSections.Banner,
                { vaultId: id.toString(), ilk },
              )
            },
            text: t('auto-sell.banner.button'),
            disabled: isConstantMultipleEnabled,
          }}
        />
      )}
    </>
  )
}
