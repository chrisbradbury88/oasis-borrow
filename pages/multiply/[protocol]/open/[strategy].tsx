import { WithConnection } from 'components/connectWallet/ConnectWallet'
import { DeferedContextProvider } from 'components/DeferedContextProvider'
import { AppLayout } from 'components/Layouts'
import { AaveOpenView } from 'features/aave/open/containers/AaveOpenView'
import { Survey } from 'features/survey'
import { WithTermsOfService } from 'features/termsOfService/TermsOfService'
import { GetServerSidePropsContext } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import React from 'react'
import { BackgroundLight } from 'theme/BackgroundLight'

import { aaveContext, AaveContextProvider } from '../../../../features/aave/AaveContextProvider'
import { loadStrategyFromUrl } from '../../../../features/aave/strategyConfig'

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const strategy = ctx.query.strategy as string
  try {
    loadStrategyFromUrl(strategy, 'multiply')
  } catch (e) {
    console.log(`could not load strategy '${strategy}' for route '${ctx.resolvedUrl}'`)
    return {
      notFound: true,
    }
  }

  return {
    props: {
      ...(await serverSideTranslations(ctx.locale!, ['common'])),
      strategy: strategy,
    },
  }
}

function OpenVault({ strategy }: { strategy: string }) {
  return (
    <AaveContextProvider>
      <WithConnection>
        <WithTermsOfService>
          <BackgroundLight />
          <DeferedContextProvider context={aaveContext}>
            <AaveOpenView config={loadStrategyFromUrl(strategy, 'multiply')} />
          </DeferedContextProvider>
          <Survey for="earn" />
        </WithTermsOfService>
      </WithConnection>
    </AaveContextProvider>
  )
}

OpenVault.layout = AppLayout

export default OpenVault
