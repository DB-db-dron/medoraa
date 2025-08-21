# SymptomAI

SymptomAI is a machine learning model designed to predict potential medical conditions based on user-provided symptoms. It utilizes a Transformer-based neural network to process natural language descriptions of symptoms and generate relevant predictions.

## Usage

The `SymptomAI` class provides a simple interface for making predictions.

### Basic Usage

By default, the `SymptomAI` class will load the `symptom_transformer.pth` model from the same directory.

```python
from symptomai import SymptomAI

# Initialize the SymptomAI model
ai = SymptomAI()

# Provide a sentence describing symptoms
symptoms = "I have a headache and a high fever for the last 3 days."

# Get a prediction
prediction = ai.predict(symptoms)

print(f"Symptoms: {symptoms}")
print(f"Prediction: {prediction}")
```

### Custom Model Path

You can also specify a custom path to a model file using the `model_path` argument in the constructor.

```python
from symptomai import SymptomAI

# Specify the path to your custom model
model_path = "path/to/your/custom_model.pth"

# Initialize the SymptomAI model with the custom model
ai = SymptomAI(model_path=model_path)

# Get a prediction
prediction = ai.predict("I feel dizzy and nauseous")

print(f"Prediction: {prediction}")
```

This will output a prediction based on the trained model.
