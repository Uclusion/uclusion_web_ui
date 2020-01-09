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
import { OperationInProgressProvider } from '../../contexts/OperationInProgressContext';
import OperationInProgressGlobalProvider from '../../components/ContextHacks/OperationInProgressGlobalProvider';
import { PageLoadingProvider } from '../../contexts/PageLoadingContext';
import { DiffProvider } from '../../contexts/DiffContext/DiffContext';
import { HighlightedCommentProvider } from '../../contexts/HighlightedCommentContext';

class Main extends Component {
  render() {
    console.debug('Main being rerendered');
    return (
      <div>
        <HighlightedCommentProvider>
          <DiffProvider>
            <PageLoadingProvider>
              <OperationInProgressProvider>
                <OperationInProgressGlobalProvider>
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
                </OperationInProgressGlobalProvider>
              </OperationInProgressProvider>
            </PageLoadingProvider>
          </DiffProvider>
        </HighlightedCommentProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
