import React from 'react';
import config from '../../config';
import '@formatjs/intl-relativetimeformat/polyfill';
import '@formatjs/intl-relativetimeformat/polyfill-locales';
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
import AppWithAuth from '../App/AppWithAuth';
import { OperationInProgressProvider } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import OperationInProgressGlobalProvider from '../../components/ContextHacks/OperationInProgressGlobalProvider';
import { DiffProvider } from '../../contexts/DiffContext/DiffContext';
import { HighlightedCommentProvider } from '../../contexts/HighlightingContexts/HighlightedCommentContext';
import { HighlightedVotingProvider } from '../../contexts/HighlightingContexts/HighlightedVotingContext';
import { AccountProvider } from '../../contexts/AccountContext/AccountContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { SearchIndexProvider } from '../../contexts/SearchIndexContext/SearchIndexContext';
import { DismissTextProvider } from '../../contexts/DismissTextContext';
import { SearchResultsProvider } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { ScrollProvider } from '../../contexts/ScrollContext';

function Main (props) {
  const stripePromise = loadStripe(config.payments.stripeKey);
  return (
    <div>
      <AccountProvider>
          <DismissTextProvider>
            <HighlightedVotingProvider>
              <HighlightedCommentProvider>
                <SearchIndexProvider>
                  <SearchResultsProvider>
                    <DiffProvider>
                      <OperationInProgressProvider>
                        <OperationInProgressGlobalProvider>
                          <VersionsProvider>
                            <ScrollProvider>
                              <NotificationsProvider>
                                <MarketsProvider>
                                  <MarketStagesProvider>
                                    <CommentsProvider>
                                      <InvestiblesProvider>
                                        <MarketPresencesProvider>
                                          <LocaleProvider>
                                            <ToastContainer position="top-center"/>
                                            <Elements stripe={stripePromise}>
                                              <AppWithAuth/>
                                            </Elements>
                                          </LocaleProvider>
                                        </MarketPresencesProvider>
                                      </InvestiblesProvider>
                                    </CommentsProvider>
                                  </MarketStagesProvider>
                                </MarketsProvider>
                              </NotificationsProvider>
                            </ScrollProvider>
                          </VersionsProvider>
                        </OperationInProgressGlobalProvider>
                      </OperationInProgressProvider>
                    </DiffProvider>
                  </SearchResultsProvider>
                </SearchIndexProvider>
              </HighlightedCommentProvider>
            </HighlightedVotingProvider>
          </DismissTextProvider>
      </AccountProvider>
    </div>
  );
}

export default withA2HS(Main);
