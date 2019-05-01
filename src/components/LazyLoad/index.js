import React from 'react';
import PropTypes from 'prop-types';

class LazyLoad extends React.PureComponent {
  state = {
    visible: false,
  };

  componentDidMount() {
    this.element.parentNode.addEventListener('scroll', this.checkVisible);
    this.checkVisible();
  }

  componentWillUnmount() {
    this.element.parentNode.removeEventListener('scroll', this.checkVisible);
  }

  checkVisible = () => {
    const { visible } = this.state;
    if (visible || !this.element) {
      return;
    }

    const { left: parentLeft, width: parentWidth } = this.element.parentElement.getBoundingClientRect();
    const { left, width } = this.element.getBoundingClientRect();
    const newVisible = (left < parentLeft + parentWidth) && (left > parentLeft - width);
    if (newVisible) {
      this.setState({ visible: true });
      this.element.parentNode.removeEventListener('scroll', this.checkVisible);
    }
  }

  render() {
    const { width, children } = this.props;
    const { visible } = this.state;

    return (
      <div
        style={{ width, minWidth: width }}
        ref={ref => this.element = ref}
      >
        {visible && children}
      </div>
    );
  }
}

LazyLoad.propTypes = {
  width: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

export default LazyLoad;
