import { NextRequest, NextResponse } from 'next/server';
import { ref, uploadBytes } from 'firebase/storage';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { app, storage } from '@/firebaseConfig';

export async function GET() {
  return NextResponse.json({ status: 'API funcionando!', timestamp: new Date().toISOString() });
}

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 API importarBase: Iniciando...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ Arquivo não enviado');
      return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 });
    }

    console.log('📁 Arquivo recebido:', file.name, 'Tamanho:', file.size);

    // Obter configurações opcionais
    const fileName = formData.get('fileName') as string || file.name;
    const tipos = formData.get('tipos') ? JSON.parse(formData.get('tipos') as string) : {};
    const setores = formData.get('setores') ? JSON.parse(formData.get('setores') as string) : {};
    const mapeamento = formData.get('mapeamento') ? JSON.parse(formData.get('mapeamento') as string) : {};
    const origem = formData.get('origem') as string || 'outros';
    const userEmail = formData.get('userEmail') as string || 'brayan@agilisvertex.com.br';

    console.log('⚙️ Configurações:', { fileName, origem, userEmail, tiposCount: Object.keys(tipos).length });

    // Converter File para Buffer
    console.log('🔄 Convertendo arquivo para buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('✅ Buffer criado, tamanho:', buffer.length);

    // Upload para Firebase Storage
    console.log('☁️ Iniciando upload para Firebase Storage...');
    try {
      const fileId = uuidv4();
      const filePath = `importacoes/${fileId}_${file.name}`;
      const storageRef = ref(storage, filePath);
      
      console.log('📍 Referência do Storage criada:', storageRef.fullPath);
      console.log('📦 Bucket configurado:', storage.app.options.storageBucket);
      
      await uploadBytes(storageRef, buffer);
      console.log('✅ Upload para Storage concluído');

      // Salvar registro no Firestore
      console.log('💾 Salvando registro no Firestore...');
      const db = getFirestore(app);
      const docRef = await addDoc(collection(db, 'importacoes'), {
        fileName: fileName,
        filePath: storageRef.fullPath,
        status: 'pendente',
        createdAt: new Date(),
        origem: origem,
        user: userEmail,
        tiposColunas: tipos,
        setoresColunas: setores,
        mapeamentoProspeccao: mapeamento,
      });
      console.log('✅ Registro salvo no Firestore:', docRef.id);

      return NextResponse.json({ success: true, id: docRef.id });
      
    } catch (storageError: any) {
      console.error('❌ Erro específico do Storage:', storageError);
      console.error('Código do erro:', storageError.code);
      console.error('Mensagem do erro:', storageError.message);
      
      return NextResponse.json({ 
        error: 'Erro no Firebase Storage',
        code: storageError.code,
        message: storageError.message,
        details: `Bucket configurado: ${storage.app.options.storageBucket}`,
        troubleshooting: [
          '1. Verifique se o Storage está habilitado no Firebase Console',
          '2. Confirme se as regras de segurança do Storage estão corretas',
          '3. Certifique-se que está logado no sistema'
        ]
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Erro geral na API importarBase:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro interno do servidor',
      code: error.code || 'unknown',
      details: error.toString()
    }, { status: 500 });
  }
} 