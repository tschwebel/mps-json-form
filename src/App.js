import React, { useState, useEffect, useMemo } from "react";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import ImpositionTemplateWidget from "./ImpositionTemplateWidget";
// import FileNameWithExtensionWidget from "./FileNameWithExtensionWidget";
import "./App.css";

const BASE_PATH = "D:/DesignMerge_Workflows/z_TESTING/Place Job Folders Here/";
const PRESET_PATH = "D:/DesignMerge_Workflows/z_TESTING/ImpositionPresets/";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only accept prep / s!mplify!
    if (username === "prep" && password === "s!mplify!") {
      onLogin(username);
    } else {
      setError("Invalid username or password.");
    }
  };

  return (
    <div className="login-container">
      <h2>Please Log In</h2>
      <form onSubmit={handleSubmit} autoComplete="on">
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState({});
  const [presetList, setPresetList] = useState([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // For storing natural image sizes to scale properly
  const [side1Size, setSide1Size] = useState({ width: 0, height: 0 });
  const [side2Size, setSide2Size] = useState({ width: 0, height: 0 });

  useEffect(() => {
    fetch("/templates.json")
      .then((res) => res.json())
      .then((data) => {
        const flattened = Object.values(data).flat();
        setPresetList(flattened);
        setIsLoadingPresets(false);
      })
      .catch((err) => {
        console.error("Failed to load templates.json", err);
        setPresetList([]);
        setIsLoadingPresets(false);
      });
  }, []);

  // Your entire original schema, uiSchema, validate, handleSubmit, getScaledStyle here
  // (I will omit repeated code for brevity but you keep your exact original code)

  const baseSchema = {
    title: "MPS Automation Job Setup",
    type: "object",
    properties: {
      JobFolderName: {
        type: "string",
        title: "Folder Name (within job folder)",
      },
      ImpositionTemplate: {
        type: "string",
        title: "Imposition Template",
      },
      kPageSetsPerJob: {
        type: "string",
        title: "Records Per Lift",
        default: "Default",
      },
      kStartRecord: {
        type: "string",
        title: "Start Record",
        default: "Default",
      },
      kEndRecord: {
        type: "string",
        title: "End Record",
        default: "Default",
      },
      kPDFImposerImposeType: {
        type: "string",
        title: "Imposition Type",
        default: "Cut & Stack",
        enum: [
          "Sequential",
          "Cut & Stack",
          "Label Sort",
          "Step & Repeat",
          "2u Saddle Stitch",
        ],
      },
      NeedsSampleOutput: {
        type: "string",
        title: "Needs Sample Output?",
        enum: ["Yes", "No"],
      },
      NeedsSampleWatermark: {
        type: "string",
        title: "Apply Sample Watermark?",
        enum: ["Yes", "No"],
        default: "No",
      },
      SampleStartRecord: {
        type: "string",
        title: "Sample Start Record",
        default: "Default",
      },
      SampleEndRecord: {
        type: "string",
        title: "Sample End Record",
        default: "Default",
      },
    },
    required: [
      "JobFolderName",
      "ImpositionTemplate",
      "NeedsSampleOutput",
    ],
  };

  const formSchema = useMemo(() => {
    if (formData.NeedsSampleOutput === "Yes") {
      return {
        ...baseSchema,
        required: [
          ...new Set([
            ...baseSchema.required,
            "NeedsSampleWatermark",
            "SampleStartRecord",
            "SampleEndRecord",
          ]),
        ],
      };
    } else {
      const {
        NeedsSampleWatermark,
        SampleStartRecord,
        SampleEndRecord,
        ...propsWithoutSamples
      } = baseSchema.properties;

      return {
        ...baseSchema,
        properties: propsWithoutSamples,
        required: baseSchema.required.filter(
          (r) =>
            ![
              "NeedsSampleWatermark",
              "SampleStartRecord",
              "SampleEndRecord",
            ].includes(r)
        ),
      };
    }
  }, [formData.NeedsSampleOutput]);

  const uiSchema = {
    ImpositionTemplate: {
      "ui:widget": ImpositionTemplateWidget,
    },
    NeedsSampleOutput: {
      "ui:widget": "radio",
    },
    NeedsSampleWatermark: {
      "ui:widget": "radio",
    },
  };

  const validate = (formData, errors) => {
    const regexPositiveInt = /^[1-9]\d*$/;
    const numericFields = ["kPageSetsPerJob", "kStartRecord", "kEndRecord"];
    numericFields.forEach((field) => {
      const val = formData[field];
      if (val !== "Default" && val !== undefined && !regexPositiveInt.test(val)) {
        errors[field].addError("Must be 'Default' or a positive integer");
      }
    });

    if (formData.NeedsSampleOutput === "Yes") {
      ["SampleStartRecord", "SampleEndRecord"].forEach((field) => {
        const val = formData[field];
        if (val !== "Default" && val !== undefined && !regexPositiveInt.test(val)) {
          errors[field].addError("Must be 'Default' or a positive integer");
        }
      });
    }

    return errors;
  };

  const handleSubmit = ({ formData }) => {
    const {
      JobFolderName,
      ImpositionTemplate,
      kPageSetsPerJob,
      kStartRecord,
      kEndRecord,
      kPDFImposerImposeType,
      NeedsSampleOutput,
      NeedsSampleWatermark,
      SampleStartRecord,
      SampleEndRecord,
    } = formData;

    const fullPath = `${BASE_PATH}${JobFolderName}`;
    const isPreset =
      Array.isArray(presetList) && presetList.includes(ImpositionTemplate);
    const impositionTemplatePath = isPreset
      ? `${PRESET_PATH}${ImpositionTemplate}`
      : `${fullPath}/${ImpositionTemplate}`;

    const output = {
      JSONID: "MPSAUTOMATION",
      Description: "MPS Properties",
      CommonProperties: [
        {
          kDDFName: "Document",
          kTemplateSearchPath: "",
          kGraphicSearchPath: "",
          kSearchSubfolders: "Yes",
          kInputCleanupActionOnFail: "Advance in Flow",
          kTreatWarningsAsErrors: "Yes",
          kDebugVerboseLogging: "No",
          kDebugShowDocumentWindows: "No",
        },
      ],
      VDPMergeProperties: [
        {
          kOutputFormat: "PDF/VT",
          kPDFPresetName: "[High Quality Print]",
          kPDFIncludeMetadata: "Yes",
          kPDFPreflightCaching: "Yes",
          kPDFVDPOptimizerMode: "Advanced",
          kPPMLBleedAmount: "0",
          kPPMLCreateBooklets: "No",
          kPPMLDownloadFonts: "Yes",
          kPSEnableCaching: "No",
          kVerifyFixedGraphicsBeforeMerge: "No",
          kCopyFitMode: "Tagged Frames Only",
          kPrinterName: "",
          kAlternateOutputFolder: "",
          kAlternateOutputAction: "Advance in Flow",
          kAlternateOutputCleanup: "Yes",
          kMergeType: "Standard",
          kVDPOptimizerMode: "Off",
          kPageSetsPerJob,
          kStartRecord,
          kEndRecord,
          kSkipFirstRecord: "Yes",
          kStepAmount: "Default",
        },
      ],
      PreflightProperties: [
        {
          kFailIfMissingFixed: "Yes",
          kFailIfMissingVariable: "Yes",
          kFailIfDamagedVariable: "Yes",
          kFailIfMissingFonts: "Yes",
          kFailIfOversetText: "Yes",
          kFailIfMismatchColumns: "No",
          kPreflightStorePreflightInfo: "Yes",
        },
      ],
      MultiupProperties: [
        {
          kMultiupTemplatePath: "Automatic",
          kMultiupFilenamePrefix: "_IMPOSED",
          kMultiupSourcePage: "All Pages",
          kMultiupDestPage: "All Pages",
          kMultiupCopyStyles: "Yes",
          kMultiupCopySwatches: "Yes",
          kMultiupCopyLayers: "Yes",
          kMultiupCopyDDF: "Yes",
          kMultiupRemoveFrames: "Yes",
          kMultiupKeepGroups: "Yes",
          kMultiupFailIfNoMultiupTemplatePath: "Yes",
        },
      ],
      PackagerProperties: [
        {
          kPackagerIncludeFixedGraphics: "Yes",
          kPackagerIncludeVariableAssets: "Yes",
          kPackagerIncludeFonts: "Yes",
          kPackagerConvertFullPathsToLocalPaths: "No",
          kPackagerClearExistingVariableImages: "No",
          kPackagerPackageName: `${JobFolderName}-Pkg`,
          kPackagerMultiupTemplatePath: "Automatic",
        },
      ],
      PDFImposerProperties: [
        {
          kPDFImposerTemplatePath: impositionTemplatePath,
          kPDFImposerInputFilePath: fullPath,
          kPDFImposerOutputFilenameFormat: "IMPOSED-<PDF_Name>",
          kPDFImposerImposeType: kPDFImposerImposeType,
          kPDFImposerDuplexMode: "No",
          kPDFImposerLabelSortColumnCount: "1",
          kPDFImposerLabelSortRowCount: "1",
          kPDFImposerLabelSortPadSetting: "Last Sheet",
          kPDFImposerLabelSortSequencing: "Vertical",
          kPDFImposerLabelSortReverse: "No",
          kPDFImposerCropTo: "Automatic",
        },
      ],
      CustomScriptProperties: [
        {
          kScriptToRun: "Automatic",
          kCustomScriptFailIfNoTemplate: "Yes",
          kCustomScriptFailIfNoDatabase: "Yes",
        },
      ],
      Samples:
        NeedsSampleOutput === "Yes"
          ? [
              {
                NeedsSampleOutput,
                NeedsSampleWatermark,
                SampleStartRecord,
                SampleEndRecord,
              },
            ]
          : [],
    };

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${JobFolderName}_MPS_Settings.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isPreset =
    Array.isArray(presetList) && presetList.includes(formData.ImpositionTemplate);
  const fullPath = `${BASE_PATH}${formData.JobFolderName || ""}`;

  const getScaledStyle = ({ width, height }, maxSize = 1000) => {
    if (!width || !height) return {};

    if (width >= height) {
      const scale = maxSize / width;
      return {
        width: maxSize,
        height: height * scale,
      };
    } else {
      const scale = maxSize / height;
      return {
        width: width * scale,
        height: maxSize,
      };
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={(user) => { setIsAuthenticated(true); setLoggedInUser(user); }} />;
  }

  return (
    <div className="page-container">
      <div className="form-wrapper">
        {/* Logo if you want */}
        {<img src="/2013_TSG_Logo_Outline.png" alt="Logo" className="form-logo" />}

        {isLoadingPresets ? (
          <div className="loading">Loading preset templates...</div>
        ) : (
          <>
            <Form
              schema={formSchema}
              uiSchema={uiSchema}
              formData={formData}
              validate={validate}
              onChange={(e) => setFormData(e.formData)}
              onSubmit={handleSubmit}
              validator={validator}
              className="custom-form"
            />

            {formData.ImpositionTemplate && (
              <div className="template-preview">
                <strong>Selected Imposition Template:</strong>
                <div className="template-info">
                  <div className="template-thumbnails">
                    <img
                      key={`${formData.ImpositionTemplate}-1`}
                      src={
                        isPreset
                          ? `/presets/${formData.ImpositionTemplate.replace(/\.pdf$/i, "")}-1.png`
                          : `/jobs/${formData.JobFolderName}/${formData.ImpositionTemplate.replace(/\.pdf$/i, "")}-1.png`
                      }
                      alt="Side 1 Preview"
                      onError={(e) => (e.target.style.display = "none")}
                      onLoad={(e) =>
                        setSide1Size({
                          width: e.target.naturalWidth,
                          height: e.target.naturalHeight,
                        })
                      }
                      style={getScaledStyle(side1Size)}
                      className="template-thumb"
                    />
                    <img
                      key={`${formData.ImpositionTemplate}-2`}
                      src={
                        isPreset
                          ? `/presets/${formData.ImpositionTemplate.replace(/\.pdf$/i, "")}-2.png`
                          : `/jobs/${formData.JobFolderName}/${formData.ImpositionTemplate.replace(/\.pdf$/i, "")}-2.png`
                      }
                      alt="Side 2 Preview"
                      onError={(e) => (e.target.style.display = "none")}
                      onLoad={(e) =>
                        setSide2Size({
                          width: e.target.naturalWidth,
                          height: e.target.naturalHeight,
                        })
                      }
                      style={getScaledStyle(side2Size)}
                      className="template-thumb"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
