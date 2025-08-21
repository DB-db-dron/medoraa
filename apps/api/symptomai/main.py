import torch
import torch.nn as nn
import math
from textblob import TextBlob
import os

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=100):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        for pos in range(max_len):
            for i in range(0, d_model, 2):
                pe[pos, i] = math.sin(pos / (10000 ** ((2 * i) / d_model)))
                if i + 1 < d_model:
                    pe[pos, i + 1] = math.cos(pos / (10000 ** ((2 * i) / d_model)))
        self.pe = pe.unsqueeze(0).to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))

    def forward(self, x):
        return x + self.pe[:, :x.size(1)]

class TransformerModel(nn.Module):
    def __init__(self, vocab_size, d_model, n_heads, ff_dim, num_layers):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = PositionalEncoding(d_model)
        self.transformer = nn.Transformer(
            d_model=d_model,
            nhead=n_heads,
            num_encoder_layers=num_layers,
            num_decoder_layers=num_layers,
            dim_feedforward=ff_dim,
            dropout=0.1,
            batch_first=True
        )
        self.fc_out = nn.Linear(d_model, vocab_size)

    def forward(self, src, tgt, src_key_padding_mask=None, tgt_key_padding_mask=None):
        src_emb = self.pos_encoding(self.embedding(src))
        tgt_emb = self.pos_encoding(self.embedding(tgt))
        tgt_mask = self.transformer.generate_square_subsequent_mask(tgt.size(1)).to(torch.device("cuda" if torch.cuda.is_available() else "cpu"))
        out = self.transformer(
            src_emb, tgt_emb, tgt_mask=tgt_mask,
            src_key_padding_mask=src_key_padding_mask,
            tgt_key_padding_mask=tgt_key_padding_mask
        )
        return self.fc_out(out)

class SymptomAI():
    def __init__(self, model_path=None):
        self.__DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.__MAX_LEN = 100

        if model_path is None:
            file_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(file_dir, "symptom_transformer.pth")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file '{model_path}' not found. Please ensure the model is available.")

        checkpoint = torch.load(model_path, map_location=self.__DEVICE)
        self.__word2idx = checkpoint['word2idx']
        self.__idx2word = checkpoint['idx2word']
        config = checkpoint['config']

        EMBED_DIM = 128
        N_HEADS = 4
        FF_DIM = 256
        NUM_LAYERS = 2

        self.__model = TransformerModel(
            vocab_size=config['vocab_size'],
            d_model=EMBED_DIM,
            n_heads=N_HEADS,
            ff_dim=FF_DIM,
            num_layers=NUM_LAYERS
        ).to(self.__DEVICE)

        self.__model.load_state_dict(checkpoint['model_state_dict'])
        self.__model.eval()

    def __encode(self, text):
        return [self.__word2idx.get(w, self.__word2idx["<unk>"]) for w in text.lower().split()]

    def __pad_seq(self, seq):
        seq = seq[:self.__MAX_LEN - 2]
        return [self.__word2idx["<sos>"]] + seq + [self.__word2idx["<eos>"]] + [self.__word2idx["<pad>"]] * (self.__MAX_LEN - len(seq) - 2)

    def _correct_spelling(self, text):
        return str(TextBlob(text).correct())

    def predict(self, sentence):
        corrected_sentence = self._correct_spelling(sentence)
        src = torch.tensor([self.__pad_seq(self.__encode(corrected_sentence))], dtype=torch.long).to(self.__DEVICE)
        tgt = torch.tensor([[self.__word2idx["<sos>"]]], dtype=torch.long).to(self.__DEVICE)
        with torch.no_grad():
            for _ in range(self.__MAX_LEN):
                out = self.__model(src, tgt)
                next_word = out[0, -1].argmax(dim=-1).item()
                tgt = torch.cat([tgt, torch.tensor([[next_word]], device=self.__DEVICE)], dim=1)
                if next_word == self.__word2idx["<eos>"]:
                    break
        return " ".join([self.__idx2word[idx.item()] for idx in tgt[0][1:-1]])
