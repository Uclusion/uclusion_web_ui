import React, { Component } from 'react';
import { withA2HS } from 'a2hs';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MarketsProvider } from '../../contexts/MarketsContext/MarketsContext';
import { InvestiblesProvider } from '../../contexts/InvestibesContext/InvestiblesContext';
import { LocaleProvider } from '../../contexts/LocaleContext';
import { CommentsProvider } from '../../contexts/CommentsContext/CommentsContext';
import { NotificationsProvider } from '../../contexts/NotificationsContext/NotificationsContext';
import { MarketPresencesProvider } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesProvider } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { VersionsProvider } from '../../contexts/VersionsContext/VersionsContext';
import { SidebarProvider } from '../../contexts/SidebarContext';
import AppWithAuth from '../App/AppWithAuth';

class Main extends Component {
  render() {
    console.debug('Main being rerendered');
    return (
      <div>
        <NotificationsProvider>
          <VersionsProvider>
            <MarketsProvider>
              <MarketStagesProvider>
                <CommentsProvider>
                  <InvestiblesProvider>
                    <MarketPresencesProvider>
                      <LocaleProvider>
                        <SidebarProvider>
                          <ToastContainer />
                          <AppWithAuth />
                        </SidebarProvider>
                      </LocaleProvider>
                    </MarketPresencesProvider>
                  </InvestiblesProvider>
                </CommentsProvider>
              </MarketStagesProvider>
            </MarketsProvider>
          </VersionsProvider>
        </NotificationsProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
