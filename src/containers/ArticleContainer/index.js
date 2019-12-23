import React from 'react';
import PropTypes from 'prop-types';
import SubSection from '../../containers/SubSection/SubSection';
import { SECTION_TYPE_PRIMARY } from '../../constants/global';
import ArticleCard from '../../components/Cards/ArticleCard';


function ArticleContainer(props) {
    const { header, title, content } = props;
    return (
        <SubSection type={SECTION_TYPE_PRIMARY} title={header}>
            <ArticleCard title={title} content={content}/>
        </SubSection>
    );
}

ArticleContainer.propTypes = {
    header: PropTypes.string,
    title: PropTypes.string,
    content: PropTypes.string,
};

ArticleContainer.defaultProps = {
    header: '',
    title: '',
    content: '',
}

export default ArticleContainer;
