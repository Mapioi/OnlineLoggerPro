import React, {Component} from 'react';
import PropTypes from 'prop-types'
import Files from 'react-files'
import {parseString} from 'xml2js';
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

    parseDataSets() {
        // TODO: parses data and stores in state
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
            // dataSetHeaders = this.state.fileJSON[]
        }
        return (
            <div className="App">
                <header className="App-header">
                    <h1>LoggerPro Online</h1>
                </header>

                <div id="layout">
                    <div className="row">
                        <Files
                            className='files-dropzone'
                            onChange={this.onFilesChange}
                            onError={App.onFilesError}
                            accepts={['.cmbl']} // TODO find out the other file formats
                            multiple={false}
                            maxFileSize={10000000}
                            minFileSize={0}
                            clickable
                        >
                            Drop files here or click to upload
                        </Files>

                        {fileLoaded
                            ? <FileInfo fileName={this.state.fileJSON["FileName"][0]}
                                        fileSize={this.state.fileSize}
                                        dataSetShapes={dataSetShapes}/>
                            : null}
                    </div>
                    <div className="row">
                        {fileLoaded
                            // TODO choose which data set to load
                            ? <DataTable dataSet={dataSets[0]}
                                         dataSetHeaders={dataSetHeaders[0]}/>
                            : <div>No file loaded</div>}
                    </div>
                </div>
            </div>
        );
    }
}


class FileInfo extends Component {
    render() {
        let shapes = this.props.dataSetShapes.map(
            (i, index) => <div key={index} className="data-set-shape">{i[0]} x {i[1]}</div>
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


class DataTable extends Component {
    render() {
        let rows = zip(this.props.dataSet);
        return <table className="data-table">
            <tbody>
            <tr>
                {this.props.dataSetHeaders.map(
                    (header, i) => <th key={i}>{header}</th>
                )}
            </tr>
            {rows.map(
                (row, i) => <tr key={i}>{
                    row.map(
                        (number, j) =>
                            <td key={i.toString() + j.toString()}>{number}</td>
                    )
                }</tr>
            )}
            </tbody>
        </table>
    }
}

DataTable.propTypes = {
    dataSetHeaders: PropTypes.array,
    dataSet: PropTypes.array
};

export default App;
