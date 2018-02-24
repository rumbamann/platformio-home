/**
 * Copyright (c) 2017-present PlatformIO Plus <contact@pioplus.com>
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import * as actions from '../actions';

import { INPUT_FILTER_KEY, selectFilter, selectVisibleProjects } from '../selectors';
import { Icon, Input, Spin, Table, Tooltip } from 'antd';
import { cmpSort, goTo } from '../../core/helpers';
import { lazyUpdateInputValue, updateInputValue } from '../../../store/actions';

import { BOARDS_INPUT_FILTER_KEY, } from '../../platform/selectors';
import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import humanize from 'humanize';
import { osRevealFile } from '../../core/actions';


class RecentProjectsBlock extends React.Component {

  static propTypes = {
    router: PropTypes.object.isRequired,

    items: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      modified: PropTypes.number.isRequired,
      boards: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      }))
    })),

    filterValue: PropTypes.string,
    setFilter: PropTypes.func.isRequired,
    updateInputValue: PropTypes.func.isRequired,
    openProject: PropTypes.func.isRequired,
    hideProject: PropTypes.func.isRequired,
    loadProjects: PropTypes.func.isRequired,
    osRevealFile: PropTypes.func.isRequired,
    showBoards: PropTypes.func.isRequired
  }

  componentWillMount() {
    this.props.loadProjects();
  }

  onDidShowBoard(name) {
    this.props.updateInputValue(BOARDS_INPUT_FILTER_KEY, name);
    this.props.showBoards();
  }

  getTableColumns() {
    return [
      {
        title: 'Name',
        dataIndex: 'name',
        className: 'text-word-break',
        sorter: (a, b) => cmpSort(a.name.toUpperCase(), b.name.toUpperCase()),
      },
      {
        title: 'Boards',
        key: 'boards',
        className: 'text-word-break',
        render: (_, record) => (
          <span>{ record.boards.map((board, index) => (
          <span key={ board.id }><a onClick={ () => this.onDidShowBoard(board.name) }>{ board.name }</a> { record.boards.length > index + 1 ? ', ' : '' }</span>
        )) }</span>
        )
      },
      {
        title: 'Modified',
        key: 'modified',
        className: 'text-nowrap',
        sorter: (a, b) => cmpSort(b.modified, a.modified),
        render: (_, record) => (
          <Tooltip title={ new Date(record.modified * 1000).toString() }>
            { humanize.relativeTime(record.modified) }
          </Tooltip>)
      },
      {
        title: 'Action',
        key: 'action',
        width: 100,
        render: (text, record) => (
          <span>
            <a onClick={ () => this.props.hideProject(record.path) }>Hide</a>
            <span className='ant-divider' />
            <a onClick={ () => this.props.openProject(record.path) }>Open</a>
          </span>
        )
      }
    ];
  }

  render() {
    if (!this.props.items) {
      return (
        <div className='text-center'>
          <Spin tip='Loading...' size='large' />
        </div>
        );
    }
    if (!this.props.items.length) {
      return null;
    }
    return (
      <div>
        <h2>Recent Projects</h2>
        <Input className='block'
          defaultValue={ this.props.filterValue }
          placeholder='Search project...'
          onChange={ e => this.props.setFilter(e.target.value) } />
        <Table rowKey='path'
          className='block'
          dataSource={ this.props.items }
          columns={ this.getTableColumns() }
          expandedRowRender={ ::this.renderExpandedRow }
          size='middle'
          pagination={ false } />
      </div>
      );
  }

  renderExpandedRow(record) {
    return (
      <div>
        <Icon type='folder' className='inline-block-tight' />
        <a onClick={ () => this.props.osRevealFile(record.path) }>
          { record.path }
        </a>
      </div>
      );
  }

}

// Redux

function mapStateToProps(state, ownProps) {
  return {
    items: selectVisibleProjects(state),
    filterValue: selectFilter(state),
    showBoards: () => goTo(ownProps.router.history, '/boards'),
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Object.assign({}, actions, {
    osRevealFile,
    updateInputValue,
    setFilter: value => dispatch(lazyUpdateInputValue(INPUT_FILTER_KEY, value))
  }), dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(RecentProjectsBlock);