/* eslint-disable */
import localforage from 'localforage';

describe('Authenticator:', function() {
  // Step 1: setup the application state
  beforeEach(function() {
    cy.visit('http://localhost:3000');
  });

  describe('Check market creation', () => {
    it('signs in and creates market and verifies', () => {
      // Step 2: Take an action (Sign in)
      cy.get(selectors.usernameInput).type("tuser+22@uclusion.com");
      cy.get(selectors.signInPasswordInput).type("Uclusi0n_test");
      cy.get(selectors.signInSignInButton).contains('Sign In').click();
      let marketName;
      cy.get(':nth-child(3) > .MuiToolbar-root > .MuiTypography-root').contains('Decision')
        .then(() => {
          return localforage.getItem('market_context').then((markets) =>{
            const { marketDetails } = markets;
            expect(marketDetails).to.be.instanceOf(Array);
            return marketDetails;
          })
          .then((marketDetailsPrevious) => {
            cy.get(':nth-child(1) > .MuiListItemIcon-root > .MuiSvgIcon-root > path').click();
            marketName = 'Cypress testing ' + Date.now();
            cy.get('#name').type(marketName);
            const description = marketName + ' description';
            cy.get('.ql-editor > p').type(description);
            cy.get('.MuiButton-contained > .MuiButton-label').click();
            return cy.get('.MuiPaper-root > .MuiGrid-root > :nth-child(1) > div > p').contains(description)
              .then(() => {
                return localforage.getItem('market_context').then((markets) =>{
                  const { marketDetails } = markets;
                  expect(marketDetails).to.be.instanceOf(Array);
                  expect(marketDetails.length).to.be.eq(marketDetailsPrevious.length + 1);
                  return marketDetails;
                })
              });
          });
      });
    });
  });

});
export const selectors = {
  // Auth component classes
  usernameInput: '[data-test="username-input"]',
  signInPasswordInput: '[data-test="sign-in-password-input"]',
  signInSignInButton: '[data-test="sign-in-sign-in-button"]',
};
