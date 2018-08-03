import React, {Component} from 'react';
import PropTypes from 'prop-types'
import Files from 'react-files'
import {parseString} from 'xml2js';
import Dygraph from 'dygraphs/index.es5';
import {Container, Row, Col, Input, Table, Navbar, NavbarBrand, Badge} from 'reactstrap';
import './App.css';


let zip = (iter) => iter[0].map((_, c) => iter.map(i => i[c]));


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fileJSON: null,
            fileSize: null,
        };

        this.onFilesChange = this.onFilesChange.bind(this);
    }

    onFilesChange(files) {
        // Is called when a file is loaded
        let file = files[0];
        let reader = new FileReader();
        reader.onloadend = () => {
            parseString(
                reader.result,
                (err, result) => this.setState({
                    fileJSON: result["Document"],
                    fileSize: file.size
                })
            );
        };
        reader.readAsText(file);
    }

    static onFilesError(error, _) {
        alert('Error code ' + error.code + ': ' + error.message)
    }


    render() {
        let fileLoaded = this.state.fileJSON !== null;
        let dataSetShapes;
        let dataSetHeaders;
        let dataSets;
        if (this.state.fileJSON !== null) {
            dataSets = this.state.fileJSON["DataSet"].map(
                (i) => i["DataColumn"].map(
                    (j) => j["ColumnCells"][0].trim().split("\n").map(
                        (k) => parseFloat(k)
                    )
                )
            );
            dataSetHeaders = this.state.fileJSON["DataSet"].map(
                (i) => i["DataColumn"].map(
                    (j) => j["ColumnUnits"][0]
                )
            );
            dataSetShapes = dataSets.map((i) => [i.length, i[0].length]);
        }
        return (
            <div className="App">
                <Navbar color="dark" dark expand="md">
                    <NavbarBrand href="#" className={"mx-auto"}>Online LoggerPro</NavbarBrand>
                </Navbar>


                <Container>
                    <Row>
                        <Col>
                            <Files className='files-dropzone'
                                   onChange={this.onFilesChange}
                                   onError={App.onFilesError}
                                   // TODO find out the other file formats
                                   accepts={['.cmbl']}
                                   multiple={false}
                                   maxFileSize={10000000}
                                   minFileSize={0}
                                   clickable={true}>
                                Drop files here or click to upload
                            </Files>
                        </Col>
                        <Col>
                            {fileLoaded
                                ? <FileInfo fileName={this.state.fileJSON["FileName"][0]}
                                            fileSize={this.state.fileSize}
                                            dataSetShapes={dataSetShapes}/>
                                : null}
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            {fileLoaded
                                // TODO choose which data set to load
                                ? <DataSetSelector dataSets={dataSets}
                                                   dataSetsHeaders={dataSetHeaders}/>
                                : <div>No file loaded</div>}
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}


class FileInfo extends Component {
    render() {
        let shapes = this.props.dataSetShapes.map(
            (i, index) => <Badge color="secondary" key={index} className="data-set-shape">{i[0]} x {i[1]}</Badge>
        );
        let numberDataSets = this.props.dataSetShapes.length;
        return (
            <div id="file-info">
                <div>File name: {this.props.fileName}</div>
                <div>File size: {this.props.fileSize}</div>
                <div>{numberDataSets} data set{numberDataSets > 1 ? "s" : ""}: {shapes}</div>
            </div>
        );
    }
}

FileInfo.propTypes = {
    fileName: PropTypes.string,
    fileSize: PropTypes.number,
    dataSetShapes: PropTypes.array // [[1, 2], [10, 5]]
};

class DataSetSelector extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDataSet: 0
        };
        this.onDataSetSelect = this.onDataSetSelect.bind(this);
    }

    onDataSetSelect(e) {
        this.setState({
            selectedDataSet: e.target.value
        })
    }

    render() {
        let i = this.state.selectedDataSet;
        return (
            <Container><Row>
                <Col>
                    <Input type="select" name="select"
                           id="data-set-selector" onChange={this.onDataSetSelect}>
                        {this.props.dataSets.map(
                            (dataSet, ind) =>
                                <option key={ind} value={ind}>Data Set {ind + 1}</option>
                        )}
                    </Input>

                    <DataTable dataSetHeaders={this.props.dataSetsHeaders[i]}
                               dataSet={this.props.dataSets[i]} />
                </Col>
                <Col>
                    <DataGraph columns={this.props.dataSets[i]}/>
                </Col>
            </Row></Container>
        );
    }
}

DataSetSelector.propTypes = {
    dataSets: PropTypes.array,
    dataSetsHeaders: PropTypes.array
};


class DataTable extends Component {
    render() {
        let rows = zip(this.props.dataSet);
        return <div className="data-table-wrapper">
            <Table className="data-table" bordered={true} hover={true}>
                <thead>
                    <tr>
                        {this.props.dataSetHeaders.map(
                            (header, i) => <th key={i}>{header}</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                {rows.map(
                    (row, i) => <tr key={i}>{
                        row.map(
                            (number, j) =>
                                <td key={i.toString() + j.toString()}>{number.toFixed(2)}</td>
                        )
                    }</tr>
                )}
                </tbody>
            </Table>
        </div>
    }
}

DataTable.propTypes = {
    dataSetHeaders: PropTypes.array,
    dataSet: PropTypes.array
};


class DataGraph extends Component {
    constructor(props) {
        super(props);
        this.g = null;
    }

    generateData() {
        return zip(
            this.props.columns
        ) //.map((i) => i.join(","));
    }

    generateOptions() {
        let labels = this.props.columns.map((_, ind) => ind === 0 ? "X" : "Y" + ind);
        return {
            labels: labels,
            series: {
                'Y2': {
                    axis: 'y2'
                }
            },
            axes: {
                y: {
                    axisLabelWidth: 60
                },
                y2: {
                    // set axis-related properties here
                    labelsKMB: true
                }
            },
            dateWindow: null,
            valueRange: null
        };
    }

    componentDidMount() {
        this.g = new Dygraph(
            this.refs.graph, this.generateData().join("\n"), this.generateOptions()
        );
    }

    render() {
        if (this.g !== null) {
            // If the digraph object has been created, we refresh the current graph
            // Else a new graph is created in componentDidMount
            this.g.updateOptions(Object.assign(
                {'file': this.generateData()}, this.generateOptions()
            ));
        }

        return <div id="graph" ref="graph"></div>
    }
}

DataGraph.propTypes = {
    columns: PropTypes.array
};

export default App;
