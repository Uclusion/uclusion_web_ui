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
import { OperationInProgressProvider } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import OperationInProgressGlobalProvider from '../../components/ContextHacks/OperationInProgressGlobalProvider';
import { DiffProvider } from '../../contexts/DiffContext/DiffContext';
import { HighlightedCommentProvider } from '../../contexts/HighlightedCommentContext';
import { HighlightedVotingProvider } from '../../contexts/HighlightedVotingContext';

class Main extends Component {
  render() {
    console.debug('Main being rerendered');
    return (
      <div>
        <HighlightedVotingProvider>
          <HighlightedCommentProvider>
            <DiffProvider>
              <OperationInProgressProvider>
                <OperationInProgressGlobalProvider>
                  <VersionsProvider>
                    <NotificationsProvider>
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
                    </NotificationsProvider>
                  </VersionsProvider>
                </OperationInProgressGlobalProvider>
              </OperationInProgressProvider>
            </DiffProvider>
          </HighlightedCommentProvider>
        </HighlightedVotingProvider>
      </div>
    );
  }
}

export default withA2HS(Main);
