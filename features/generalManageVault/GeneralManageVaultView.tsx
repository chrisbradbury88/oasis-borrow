import { ManageMultiplyVaultContainer } from 'components/vault/commonMultiply/ManageMultiplyVaultContainer'
import { DefaultVaultHeader } from 'components/vault/DefaultVaultHeader'
import { ManageEarnVaultContainer } from 'components/vault/earn/ManageEarnVaultContainer'
import { ManageVaultContainer } from 'features/borrow/manage/containers/ManageVaultContainer'
import { SidebarManageGuniVault } from 'features/earn/guni/manage/sidebars/SidebarManageGuniVault'
import { SidebarManageMultiplyVault } from 'features/multiply/manage/sidebars/SidebarManageMultiplyVault'
import React from 'react'
import { Container } from 'theme-ui'

import { GuniVaultHeader } from '../earn/guni/common/GuniVaultHeader'
import { GuniManageMultiplyVaultDetails } from '../earn/guni/manage/containers/GuniManageMultiplyVaultDetails'
import { ManageInstiVaultContainer } from '../instiVault/manage/containers/ManageInstiVaultContainer'
import { ManageMultiplyVaultDetails } from '../multiply/manage/containers/ManageMultiplyVaultDetails'
import { VaultHistoryView } from '../vaultHistory/VaultHistoryView'
import { GeneralManageVaultState } from './generalManageVault'
import { VaultType } from './vaultType'

interface GeneralManageVaultViewProps {
  generalManageVault: GeneralManageVaultState
}

export function GeneralManageVaultViewAutomation({
  generalManageVault,
}: GeneralManageVaultViewProps) {
  const vaultType = generalManageVault.type

  switch (vaultType) {
    case VaultType.Borrow:
      return (
        <Container variant="vaultPageContainer" sx={{ zIndex: 0 }}>
          <ManageVaultContainer manageVault={generalManageVault.state} />
        </Container>
      )
    case VaultType.Insti:
      return (
        <Container variant="vaultPageContainer" sx={{ zIndex: 0 }}>
          <ManageInstiVaultContainer manageVault={generalManageVault.state} />
        </Container>
      )
    case VaultType.Multiply:
      return (
        <Container variant="vaultPageContainer" sx={{ zIndex: 0 }}>
          <ManageMultiplyVaultContainer
            manageVault={generalManageVault.state}
            header={DefaultVaultHeader}
            details={ManageMultiplyVaultDetails}
            form={SidebarManageMultiplyVault}
            history={VaultHistoryView}
          />
        </Container>
      )
    case VaultType.Earn:
      return (
        <Container variant="vaultPageContainer" sx={{ zIndex: 0 }}>
          <ManageEarnVaultContainer
            manageVault={generalManageVault.state}
            details={GuniManageMultiplyVaultDetails}
            header={GuniVaultHeader}
            form={SidebarManageGuniVault}
            history={VaultHistoryView}
          />
        </Container>
      )

    default:
      throw new Error(
        `could not render GeneralManageVaultViewAutomation for vault type ${vaultType}`,
      )
  }
}
