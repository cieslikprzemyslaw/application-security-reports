import React from 'react';
import { Link } from 'react-router-dom';

import PageContent from '~/app/layouts/pageContent';
import { routes } from '~/routes';

import StyledNotFound from './notFound.styled';

const NotFound = () => (
  <PageContent maxWidth="wide">
    <StyledNotFound>
      <p className="not-found-eyebrow">404</p>

      <h1 className="not-found-title">Requested page not found</h1>

      <p className="not-found-message">
        The page you requested does not exist in this workspace.
      </p>

      <Link className="not-found-link" to={routes.dashboard}>
        Back to Dashboard
      </Link>
    </StyledNotFound>
  </PageContent>
);

export default NotFound;
