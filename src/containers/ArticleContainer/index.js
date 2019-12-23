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
    header: 'Background Information',
    title: 'Test Decision for UI',
    content: 'Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris. Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris.',
}

export default ArticleContainer;
