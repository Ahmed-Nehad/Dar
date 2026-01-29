export async function safeDB<T>(
    operationName: string,
    promise: Promise<T>
): Promise<T | null> {

    try {
        // 1. Execute the DB Operation
        const result = await promise;
        return result;

    } catch (error: any) {
        // 2. Catch & Categorize Errors
        console.error(`❌ DB Error [${operationName}]:`, error);

        let friendlyMsg = "حدث خطأ غير متوقع";

        if (error.name === 'QuotaExceededError') {
            friendlyMsg = "عذراً، مساحة التخزين ممتلئة!";
        } else if (error.name === 'SchemaError') {
            friendlyMsg = "تحديث بيانات مطلوب (أعد تحميل الصفحة)";
        } else if (error.message?.includes('Network')) {
            friendlyMsg = "فشل الاتصال بالخادم. سيتم الحفظ محلياً.";
        }

        // 3. Notify Admin (You can replace this with alert or custom UI state)
        alert(`⚠️ خطأ في ${operationName}:\n${friendlyMsg}`);

        return null;
    }
}